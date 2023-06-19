import type { Seconds, TimestampSecs } from '../../app';
import type { QueryFunc } from '../db/mysql';
import { decrypt, encrypt } from '../security/encryption';
import { Result } from '../utils/result';
import { nowUtc } from '../utils/time';
import { Label } from './label';
import type { Auth } from './user';
import { UUID } from './uuid';

// RawEvent is the raw data from the database,
// Event is the data after decryption and links to labels
export type RawEvent = Omit<Event, 'label' | 'decrypted'> & {
    label?: string;
    decrypted: false;
};

export class Event {
    static NEW_EVENT_NAME = 'New Event';
    static DEFAULT_COLOR = '#666666';

    public label?: Label;
    public readonly decrypted = true;

    public constructor(
        public id: string,
        public name: string,
        public start: TimestampSecs,
        public end: TimestampSecs,
        public created: TimestampSecs
    ) {}

    public static async allRaw(
        query: QueryFunc,
        auth: Auth
    ): Promise<RawEvent[]> {
        return await query<RawEvent[]>`
            SELECT id,
                   name,
                   start,
                   end,
                   label,
                   created
            FROM events
            WHERE user = ${auth.id}
            ORDER BY created DESC
        `;
    }

    public static async all(
        query: QueryFunc,
        auth: Auth
    ): Promise<Result<Event[]>> {
        const { err, val: labels } = await Label.all(query, auth);
        if (err) return Result.err(err);

        const rawEvents = await Event.allRaw(query, auth);

        const events = [];

        for (const rawEvent of rawEvents) {
            const { err, val } = await Event.fromRaw(
                query,
                auth,
                rawEvent,
                labels
            );
            if (err) return Result.err(err);
            events.push(val);
        }

        return Result.ok(events);
    }

    public static async fromId(
        query: QueryFunc,
        auth: Auth,
        id: string
    ): Promise<Result<Event>> {
        const events = await query<RawEvent[]>`
            SELECT id,
                   name,
                   start,
                   end,
                   label
            FROM events
            WHERE user = ${auth.id}
              AND id = ${id}
        `;

        if (events.length !== 1) {
            return Result.err(`Event not found`);
        }

        return await Event.fromRaw(query, auth, events[0]);
    }

    public static async fromRaw(
        query: QueryFunc,
        auth: Auth,
        rawEvent: RawEvent,
        labels?: Label[]
    ): Promise<Result<Event>> {
        const { err, val: nameDecrypted } = decrypt(rawEvent.name, auth.key);
        if (err) return Result.err(err);

        const event = new Event(
            rawEvent.id,
            nameDecrypted,
            rawEvent.start,
            rawEvent.end,
            rawEvent.created
        );

        if (rawEvent.label) {
            if (labels) {
                event.label = labels.find(l => l.id === rawEvent.label);
            }
            if (!event.label) {
                const { err } = await Event.addLabel(
                    query,
                    auth,
                    event,
                    rawEvent.label
                );
                if (err) return Result.err(err);
            }
            if (!event.label) {
                return Result.err('Label not found');
            }
        }

        return Result.ok(event);
    }

    public static async create(
        query: QueryFunc,
        auth: Auth,
        name: string,
        start: TimestampSecs,
        end: TimestampSecs,
        label?: string,
        created?: TimestampSecs
    ): Promise<Result<Event>> {
        const id = await UUID.generateUUId(query);
        created ??= nowUtc();

        if (!name) {
            return Result.err('Event name cannot be empty');
        }

        const event = new Event(id, name, start, end, created);

        if (label) {
            const { err } = await Event.addLabel(query, auth, event, label);
            if (err) return Result.err(err);
        }

        const { err: nameErr, val: nameEncrypted } = encrypt(name, auth.key);
        if (nameErr) return Result.err(nameErr);

        if (nameEncrypted.length > 256) {
            return Result.err('Name too long');
        }

        await query`
            INSERT INTO events
                (id, user, name, start, end, created, label)
            VALUES (${id},
                    ${auth.id},
                    ${nameEncrypted},
                    ${start},
                    ${end},
                    ${created},
                    ${label || null})
        `;

        return Result.ok(event);
    }

    public static async purgeAll(query: QueryFunc, auth: Auth): Promise<void> {
        await query`
            DELETE
            FROM events
            WHERE user = ${auth.id}
        `;
    }

    public static jsonIsRawEvent(json: unknown): json is Omit<
        Event,
        'id' | 'label'
    > & {
        label?: string;
    } {
        return (
            typeof json === 'object' &&
            json !== null &&
            'name' in json &&
            typeof json.name === 'string' &&
            'start' in json &&
            typeof json.start === 'number' &&
            'end' in json &&
            typeof json.end === 'number' &&
            'created' in json &&
            typeof json.created === 'number' &&
            (!('label' in json) ||
                typeof json.label === 'string' ||
                json.label === null ||
                json.label === undefined)
        );
    }

    public static duration(evt: {
        start: TimestampSecs;
        end: TimestampSecs;
    }): Seconds {
        return evt.end - evt.start;
    }

    /**
     * Orders events against each other.
     * Used to find Y position of events in timeline.
     */
    public static compare(evt1: Event, evt2: Event): boolean {
        const evt1Duration = Event.duration(evt1);
        const evt2Duration = Event.duration(evt2);

        if (evt1Duration !== evt2Duration) {
            return evt1Duration > evt2Duration;
        }

        if (evt1.start !== evt2.start) {
            return evt1.start > evt2.start;
        }

        if (evt1.end !== evt2.end) {
            return evt1.end > evt2.end;
        }

        if (evt1.created !== evt2.created) {
            return evt1.created > evt2.created;
        }

        return evt1.id.localeCompare(evt2.id) > 0;
    }

    public static isInstantEvent(evt: {
        start: TimestampSecs;
        end: TimestampSecs;
    }): boolean {
        return Event.duration(evt) < 60;
    }

    public static intersects(
        evt1: { start: TimestampSecs; end: TimestampSecs },
        evt2: { start: TimestampSecs; end: TimestampSecs }
    ): boolean {
        return (
            (evt1.start <= evt2.start && evt1.end >= evt2.start) ||
            (evt2.start <= evt1.start && evt2.end >= evt1.start)
        );
    }

    public static async updateName(
        query: QueryFunc,
        auth: Auth,
        self: Event,
        namePlaintext: string
    ): Promise<Result<Event>> {
        if (!namePlaintext) {
            return Result.err('Event name cannot be empty');
        }
        self.name = namePlaintext;

        const { err, val: nameEncrypted } = encrypt(namePlaintext, auth.key);
        if (err) return Result.err(err);

        if (nameEncrypted.length > 256) {
            return Result.err('Name too long');
        }

        await query`
            UPDATE events
            SET name = ${nameEncrypted}
            WHERE id = ${self.id}
        `;
        return Result.ok(self);
    }

    public static async updateStart(
        query: QueryFunc,
        auth: Auth,
        self: Event,
        start: TimestampSecs
    ): Promise<Result<Event>> {
        if (start > self.end) {
            const { err } = await Event.updateEnd(
                query,
                auth,
                self,
                // If trying to update start to be after end,
                // update end to be 1 hour after start
                start + 60 * 60
            );
            if (err) return Result.err(err);
        }
        self.start = start;
        await query`
            UPDATE events
            SET start = ${start}
            WHERE id = ${self.id}
              AND user = ${auth.id}
        `;
        return Result.ok(self);
    }

    public static async updateEnd(
        query: QueryFunc,
        auth: Auth,
        self: Event,
        end: TimestampSecs
    ): Promise<Result<Event>> {
        if (end < self.start) {
            const { err } = await Event.updateStart(
                query,
                auth,
                self,
                // If trying to update end to be before start,
                // update start to be 1 hour before end
                end - 60 * 60
            );
            if (err) return Result.err(err);
        }
        self.end = end;
        await query`
            UPDATE events
            SET end = ${end}
            WHERE id = ${self.id}
              AND user = ${auth.id}
        `;
        return Result.ok(self);
    }

    public static async updateStartAndEnd(
        query: QueryFunc,
        auth: Auth,
        self: Event,
        start: TimestampSecs,
        end: TimestampSecs
    ): Promise<Result<Event>> {
        if (start > end) {
            return Result.err('Start time cannot be after end time');
        }
        self.start = start;
        self.end = end;
        await query`
            UPDATE events
            SET start = ${start},
                end   = ${end}
            WHERE id = ${self.id}
              AND user = ${auth.id}
        `;
        return Result.ok(self);
    }

    public static async updateLabel(
        query: QueryFunc,
        auth: Auth,
        self: Event,
        labelId: string
    ): Promise<Result<Event>> {
        if (!labelId) {
            delete self.label;
            await query`
                UPDATE events
                SET label = NULL
                WHERE id = ${self.id}
                  AND user = ${auth.id}
            `;
            return Result.ok(self);
        }

        const { err } = await Event.addLabel(query, auth, self, labelId);
        if (err) return Result.err(err);

        await query`
            UPDATE events
            SET label = ${labelId}
            WHERE id = ${self.id}
              AND user = ${auth.id}
        `;

        return Result.ok(self);
    }

    public static async purge(
        query: QueryFunc,
        auth: Auth,
        self: Event
    ): Promise<Result> {
        await query`
            DELETE
            FROM events
            WHERE id = ${self.id}
              AND user = ${auth.id}
        `;
        return Result.ok(null);
    }

    public static async withLabel(
        query: QueryFunc,
        auth: Auth,
        labelId: string
    ): Promise<Result<Event[]>> {
        const { err } = await Label.fromId(query, auth, labelId);
        if (err) return Result.err(err);

        const { val: events, err: allErr } = await Event.all(query, auth);
        if (allErr) return Result.err(allErr);

        return Result.ok(events.filter(evt => evt.label?.id === labelId));
    }

    public static async reassignAllLabels(
        query: QueryFunc,
        auth: Auth,
        oldLabel: string,
        newLabel: string
    ): Promise<Result> {
        await query`
            UPDATE events
            SET label = ${newLabel}
            WHERE label = ${oldLabel}
              AND user = ${auth.id}
        `;
        return Result.ok(null);
    }

    public static async removeAllLabel(
        query: QueryFunc,
        auth: Auth,
        labelId: string
    ): Promise<Result> {
        await query`
            UPDATE events
            SET label = NULL
            WHERE label = ${labelId}
              AND user = ${auth.id}
        `;
        return Result.ok(null);
    }

    private static async addLabel(
        query: QueryFunc,
        auth: Auth,
        self: Event,
        label: Label | string
    ): Promise<Result<Event>> {
        if (typeof label === 'string') {
            const { val, err } = await Label.fromId(query, auth, label);
            if (err) {
                return Result.err(err);
            }
            self.label = val;
        } else {
            self.label = label;
        }

        return Result.ok(self);
    }
}
