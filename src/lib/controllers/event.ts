import type { QueryFunc } from '../db/mysql';
import { decrypt, encrypt } from '../security/encryption';
import { generateUUId } from '../security/uuid';
import { Result } from '../utils/result';
import { nowS } from '../utils/time';
import type { Seconds, TimestampSecs } from '../utils/types';
import { Label } from './label';
import type { Auth } from './user';

// RawEvent is the raw data from the database,
// Event is the data after decryption and links to labels
export type RawEvent =
    Omit<
        Event, 'label'
               | 'decrypted'
    > & {
        label?: string,
        decrypted: false
    };

export class Event {
    public label?: Label;
    public readonly decrypted = true;

    public constructor (
        public id: string,
        public name: string,
        public start: TimestampSecs,
        public end: TimestampSecs,
        public created: TimestampSecs,
    ) {
    }

    public static async allRaw (
        query: QueryFunc,
        auth: Auth,
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

    public static async all (
        query: QueryFunc,
        auth: Auth,
    ): Promise<Result<Event[]>> {
        const rawEvents = await Event.allRaw(query, auth);

        const events = [];

        for (const rawEvent of rawEvents) {
            const { err, val } = await Event.fromRaw(query, auth, rawEvent);
            if (err) return Result.err(err);
            events.push(val);
        }

        return Result.ok(events);
    }

    public static async fromId (
        query: QueryFunc,
        auth: Auth,
        id: string,
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

    public static async fromRaw (
        query: QueryFunc,
        auth: Auth,
        rawEvent: RawEvent,
    ): Promise<Result<Event>> {
        const event = new Event(
            rawEvent.id,
            decrypt(rawEvent.name, auth.key),
            rawEvent.start,
            rawEvent.end,
            rawEvent.created,
        );

        if (rawEvent.label) {
            const { err } = await Event.addLabel(
                query, auth, event, rawEvent.label);
            if (err) return Result.err(err);
        }

        return Result.ok(event);
    }

    public static async create (
        query: QueryFunc,
        auth: Auth,
        name: string,
        start: TimestampSecs,
        end: TimestampSecs,
        label?: string,
        created?: TimestampSecs,
    ): Promise<Result<Event>> {
        const id = await generateUUId(query);
        created ??= nowS();

        const event = new Event(
            id,
            name,
            start,
            end,
            created,
        );

        if (label) {
            const { err } = await Event.addLabel(query, auth, event, label);
            if (err) return Result.err(err);
        }

        await query`
            INSERT INTO events
                (id, user, name, start, end, created, label)
            VALUES (${id},
                    ${auth.id},
                    ${encrypt(name, auth.key)},
                    ${start},
                    ${end},
                    ${created},
                    ${label || null})
        `;

        return Result.ok(event);
    }

    public static async purgeAll (
        query: QueryFunc,
        auth: Auth,
    ): Promise<void> {
        await query`
            DELETE
            FROM events
            WHERE user = ${auth.id}
        `;
    }

    public static jsonIsRawEvent (
        json: unknown,
    ): json is Omit<Event, 'id' | 'label'> & {
        label?: string
    } {
        return typeof json === 'object'
            && json !== null
            && 'name' in json
            && typeof json.name === 'string'
            && 'start' in json
            && typeof json.start === 'number'
            && 'end' in json
            && typeof json.end === 'number'
            && 'created' in json
            && typeof json.created === 'number'
            && (
                !('label' in json)
                || typeof json.label === 'string'
                || json.label === null
                || json.label === undefined
            );
    }

    public static duration (
        evt: { start: TimestampSecs, end: TimestampSecs },
    ): Seconds {
        return evt.end - evt.start;
    }

    public static intersects (
        evt1: { start: TimestampSecs, end: TimestampSecs },
        evt2: { start: TimestampSecs, end: TimestampSecs },
    ): boolean {
        return evt1.start <= evt2.start
            && evt1.end >= evt2.start
            || evt2.start <= evt1.start
            && evt2.end >= evt1.start;
    }

    public static async updateName (
        query: QueryFunc,
        auth: Auth,
        self: Event,
        namePlaintext: string,
    ): Promise<Result<Event>> {
        if (!namePlaintext) {
            return Result.err('Event name cannot be empty');
        }
        self.name = namePlaintext;
        await query`
            UPDATE events
            SET name = ${encrypt(namePlaintext, auth.key)}
            WHERE id = ${self.id}
        `;
        return Result.ok(self);
    }

    public static async updateStart (
        query: QueryFunc,
        auth: Auth,
        self: Event,
        start: TimestampSecs,
    ): Promise<Result<Event>> {
        if (start > self.end) {
            return Result.err('Start time cannot be after end time');
        }
        if (start < 0) {
            return Result.err('Start time cannot be negative');
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

    public static async updateEnd (
        query: QueryFunc,
        auth: Auth,
        self: Event,
        end: TimestampSecs,
    ): Promise<Result<Event>> {
        if (end < self.start) {
            return Result.err('End time cannot be before start time');
        }
        if (end < 0) {
            return Result.err('End time cannot be negative');
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

    public static async updateLabel (
        query: QueryFunc,
        auth: Auth,
        self: Event,
        labelId: string,
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

    public static async purge (
        query: QueryFunc,
        auth: Auth,
        self: Event,
    ): Promise<Result> {
        await query`
            DELETE
            FROM events
            WHERE id = ${self.id}
              AND user = ${auth.id}
        `;
        return Result.ok(null);
    }

    private static async addLabel (
        query: QueryFunc,
        auth: Auth,
        self: Event,
        label: Label | string,
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