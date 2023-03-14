import type { QueryFunc } from '../db/mysql';
import { decrypt, encrypt } from '../security/encryption';
import { generateUUId } from '../security/uuid';
import type { NonFunctionProperties } from '../utils';
import { nowS, Result } from '../utils';
import { Controller } from './controller';
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

export type DecryptedRawEvent = Omit<RawEvent, 'decrypted'> & {
    decrypted: true
};

export class Event extends Controller {
    public label?: Label;
    public readonly decrypted = true;

    public constructor (
        public id: string,
        public name: string,
        public start: number,
        public end: number,
        public created: number,
    ) {
        super();
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
            const { err } = await event.addLabel(
                query, auth, rawEvent.label);
            if (err) return Result.err(err);
        }

        return Result.ok(event);
    }

    public static async create (
        query: QueryFunc,
        auth: Auth,
        name: string,
        start: number,
        end: number,
        label?: string,
        created?: number,
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
            const { err } = await event.addLabel(query, auth, label);
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

    public override json (): NonFunctionProperties<Event> {
        return {
            ...this,
            label: this.label?.json(),
        };
    }

    async updateName (
        query: QueryFunc,
        auth: Auth,
        namePlaintext: string,
    ): Promise<Result<Event>> {
        if (!namePlaintext) {
            return Result.err('Event name cannot be empty');
        }
        this.name = namePlaintext;
        await query`
            UPDATE events
            SET name = ${encrypt(namePlaintext, auth.key)}
            WHERE id = ${this.id}
        `;
        return Result.ok(this);
    }

    async updateStart (
        query: QueryFunc,
        auth: Auth,
        start: number,
    ): Promise<Result<Event>> {
        if (start > this.end) {
            return Result.err('Start time cannot be after end time');
        }
        if (start < 0) {
            return Result.err('Start time cannot be negative');
        }
        this.start = start;
        await query`
            UPDATE events
            SET start = ${start}
            WHERE id = ${this.id}
              AND user = ${auth.id}
        `;
        return Result.ok(this);
    }

    async updateEnd (
        query: QueryFunc,
        auth: Auth,
        end: number,
    ): Promise<Result<Event>> {
        if (end < this.start) {
            return Result.err('End time cannot be before start time');
        }
        if (end < 0) {
            return Result.err('End time cannot be negative');
        }
        this.end = end;
        await query`
            UPDATE events
            SET end = ${end}
            WHERE id = ${this.id}
              AND user = ${auth.id}
        `;
        return Result.ok(this);
    }

    async updateLabel (
        query: QueryFunc,
        auth: Auth,
        labelId: string,
    ): Promise<Result<Event>> {
        if (!labelId) {
            delete this.label;
            await query`
                UPDATE events
                SET label = NULL
                WHERE id = ${this.id}
                  AND user = ${auth.id}
            `;
            return Result.ok(this);
        }
        
        const { err } = await this.addLabel(query, auth, labelId);
        if (err) return Result.err(err);

        await query`
            UPDATE events
            SET label = ${labelId}
            WHERE id = ${this.id}
              AND user = ${auth.id}
        `;

        return Result.ok(this);
    }

    public async delete (
        query: QueryFunc,
        auth: Auth,
    ): Promise<Result> {
        await query`
            DELETE
            FROM events
            WHERE id = ${this.id}
              AND user = ${auth.id}
        `;
        return Result.ok(null);
    }

    private async addLabel (
        query: QueryFunc,
        auth: Auth,
        label: Label | string,
    ): Promise<Result<Event>> {
        if (typeof label === 'string') {
            const { val, err } = await Label.fromId(query, auth, label);
            if (err) {
                return Result.err(err);
            }
            this.label = val;
        } else {
            this.label = label;
        }

        return Result.ok(this);
    }
}