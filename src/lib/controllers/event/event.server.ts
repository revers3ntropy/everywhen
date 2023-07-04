import type { QueryFunc } from '$lib/db/mysql.server';
import { decrypt, encrypt } from '$lib/security/encryption.server';
import { Result } from '$lib/utils/result';
import { nowUtc } from '$lib/utils/time';
import { Label } from '../label/label';
import type { Auth } from '../user/user';
import { UUId } from '../uuid/uuid';
import type { Event as _Event, RawEvent } from './event';

export type Event = _Event;

namespace EventUtils {
    export async function allRaw(query: QueryFunc, auth: Auth): Promise<RawEvent[]> {
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

    export async function all(query: QueryFunc, auth: Auth): Promise<Result<Event[]>> {
        const { err, val: labels } = await Label.all(query, auth);
        if (err) return Result.err(err);

        const rawEvents = await Event.allRaw(query, auth);

        const events = [];

        for (const rawEvent of rawEvents) {
            const { err, val } = await Event.fromRaw(query, auth, rawEvent, labels);
            if (err) return Result.err(err);
            events.push(val);
        }

        return Result.ok(events);
    }

    export async function fromId(query: QueryFunc, auth: Auth, id: string): Promise<Result<Event>> {
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

    export async function fromRaw(
        query: QueryFunc,
        auth: Auth,
        rawEvent: RawEvent,
        labels?: Label[]
    ): Promise<Result<Event>> {
        const { err, val: nameDecrypted } = decrypt(rawEvent.name, auth.key);
        if (err) return Result.err(err);

        const event = {
            id: rawEvent.id,
            name: nameDecrypted,
            start: rawEvent.start,
            end: rawEvent.end,
            created: rawEvent.created
        } as Event;

        if (rawEvent.label) {
            if (labels) {
                event.label = labels.find(l => l.id === rawEvent.label);
            }
            if (!event.label) {
                const { err } = await addLabel(query, auth, event, rawEvent.label);
                if (err) return Result.err(err);
            }
            if (!event.label) {
                return Result.err('Label not found');
            }
        }

        return Result.ok(event);
    }

    export async function create(
        query: QueryFunc,
        auth: Auth,
        name: string,
        start: TimestampSecs,
        end: TimestampSecs,
        label?: string,
        created?: TimestampSecs
    ): Promise<Result<Event>> {
        const id = await UUId.generateUUId(query);
        created ??= nowUtc();

        if (!name) {
            return Result.err('Event name cannot be empty');
        }

        const event = { id, name, start, end, created };

        if (label) {
            const { err } = await addLabel(query, auth, event, label);
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

    export async function purgeAll(query: QueryFunc, auth: Auth): Promise<void> {
        await query`
            DELETE
            FROM events
            WHERE user = ${auth.id}
        `;
    }

    export async function updateName(
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

    export async function updateStart(
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

    export async function updateEnd(
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

    export async function updateStartAndEnd(
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
            SET   start = ${start},
                  end   = ${end}
            WHERE id = ${self.id}
              AND user = ${auth.id}
        `;
        return Result.ok(self);
    }

    export async function updateLabel(
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

        const { err } = await addLabel(query, auth, self, labelId);
        if (err) return Result.err(err);

        await query`
            UPDATE events
            SET label = ${labelId}
            WHERE id = ${self.id}
              AND user = ${auth.id}
        `;

        return Result.ok(self);
    }

    export async function purge(query: QueryFunc, auth: Auth, self: Event): Promise<Result> {
        await query`
            DELETE
            FROM events
            WHERE id = ${self.id}
              AND user = ${auth.id}
        `;
        return Result.ok(null);
    }

    export async function withLabel(
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

    export async function reassignAllLabels(
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

    export async function removeAllLabel(
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

    async function addLabel(
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

export const Event = EventUtils;
