import { LIMITS } from '$lib/constants';
import { query } from '$lib/db/mysql.server';
import { decrypt, encrypt } from '$lib/utils/encryption';
import { FileLogger } from '$lib/utils/log.server';
import { Result } from '$lib/utils/result';
import { nowUtc } from '$lib/utils/time';
import type { TimestampSecs } from '../../../types';
import type { Auth } from '../auth/auth.server';
import { Label } from '../label/label.server';
import { Event as _Event } from './event';
import { UId } from '$lib/controllers/uuid/uuid.server';

const logger = new FileLogger('Event');

namespace EventServer {
    interface RawEvent {
        id: string;
        name: string;
        start: number;
        end: number;
        created: number;
        labelId: string | null;
    }

    export async function all(auth: Auth): Promise<Result<Event[]>> {
        const { err, val: labels } = await Label.Server.allIndexedById(auth);
        if (err) return Result.err(err);

        const rawEvents = await query<
            {
                id: string;
                name: string;
                start: number;
                end: number;
                labelId: string;
                created: number;
            }[]
        >`
            SELECT id,
                   name,
                   start,
                   end,
                   labelId,
                   created
            FROM events
            WHERE userId = ${auth.id}
            ORDER BY created DESC
        `;

        return Result.collect(rawEvents.map(e => fromRaw(auth, e, labels)));
    }

    export async function fromId(auth: Auth, id: string): Promise<Result<Event>> {
        const events = await query<RawEvent[]>`
            SELECT id,
                   name,
                   start,
                   end,
                   labelId
            FROM events
            WHERE userId = ${auth.id}
              AND id = ${id}
        `;
        if (events.length !== 1) {
            if (events.length !== 0) {
                await logger.log(`Expected 1 event with id ${id}, got ${events.length} instead`, {
                    userId: auth.id,
                    username: auth.username,
                    id,
                    events
                });
            }
            return Result.err(`Event not found`);
        }
        const [event] = events;

        const { err, val: labels } = await Label.Server.allIndexedById(auth);
        if (err) return Result.err(err);

        return fromRaw(auth, event, labels);
    }

    export function fromRaw(
        auth: Auth,
        rawEvent: RawEvent,
        labels: Record<string, Label>
    ): Result<Event> {
        const { err, val: nameDecrypted } = decrypt(rawEvent.name, auth.key);
        if (err) return Result.err(err);

        let label: Label | null = null;
        if (rawEvent.labelId) {
            label = labels[rawEvent.labelId];
            if (!label) {
                return Result.err(`Label not found`);
            }
        }

        return Result.ok({
            id: rawEvent.id,
            name: nameDecrypted,
            start: rawEvent.start,
            end: rawEvent.end,
            created: rawEvent.created,
            label
        });
    }

    async function canCreateEventWithName(auth: Auth, name: string): Promise<string | true> {
        const numEvents = await query<{ count: number }[]>`
            SELECT COUNT(*) as count
            FROM events
            WHERE userId = ${auth.id}
        `;

        if (numEvents[0].count > LIMITS.event.maxCount)
            return `Maximum number of events (${LIMITS.event.maxCount}) reached`;

        if (name.length < LIMITS.event.nameLenMin) return 'Event name too short';

        if (name.length > LIMITS.event.nameLenMax) return 'Event name too long';

        return true;
    }

    export async function create(
        auth: Auth,
        name: string,
        start: TimestampSecs,
        end: TimestampSecs,
        labelId: string | null,
        created: TimestampSecs | null
    ): Promise<Result<RawEvent>> {
        const canCreate = await canCreateEventWithName(auth, name);
        if (canCreate !== true) return Result.err(canCreate);

        const id = await UId.Server.generate();
        created ??= nowUtc();

        await query`
            INSERT INTO events
                (id, userId, name, start, end, created, labelId)
            VALUES (${id},
                    ${auth.id},
                    ${encrypt(name, auth.key)},
                    ${start},
                    ${end},
                    ${created},
                    ${labelId || null})
        `;

        return Result.ok({
            id,
            created,
            name,
            start,
            end,
            labelId
        });
    }

    export async function purgeAll(auth: Auth): Promise<void> {
        await query`
            DELETE
            FROM events
            WHERE userId = ${auth.id}
        `;
    }

    export async function updateName(
        auth: Auth,
        self: Event,
        namePlaintext: string
    ): Promise<Result<Event>> {
        if (!namePlaintext) {
            return Result.err('Event name cannot be empty');
        }
        self.name = namePlaintext;

        const nameEncrypted = encrypt(namePlaintext, auth.key);

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
        auth: Auth,
        self: Event,
        start: TimestampSecs
    ): Promise<Result<Event>> {
        if (start > self.end) {
            const { err } = await updateEnd(
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
              AND userId = ${auth.id}
        `;
        return Result.ok(self);
    }

    export async function updateEnd(
        auth: Auth,
        self: Event,
        end: TimestampSecs
    ): Promise<Result<Event>> {
        if (end < self.start) {
            const { err } = await updateStart(
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
              AND userId = ${auth.id}
        `;
        return Result.ok(self);
    }

    export async function updateStartAndEnd(
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
                end = ${end}
            WHERE id = ${self.id}
                AND userId = ${auth.id}
        `;
        return Result.ok(self);
    }

    export async function updateLabel(
        auth: Auth,
        self: Event,
        labelId: string | null
    ): Promise<Result<Event>> {
        if (!labelId) {
            await query`
                UPDATE events
                SET labelId = NULL
                WHERE id = ${self.id}
                  AND userId = ${auth.id}
            `;
            return Result.ok({
                ...self,
                label: null
            });
        }

        const { err, val: label } = await Label.Server.fromId(auth, labelId);
        if (err) return Result.err(err);

        await query`
            UPDATE events
            SET labelId = ${labelId}
            WHERE id = ${self.id}
              AND userId = ${auth.id}
        `;

        return Result.ok({
            ...self,
            label
        });
    }

    export async function purge(auth: Auth, self: Event): Promise<Result<null>> {
        await query`
            DELETE
            FROM events
            WHERE id = ${self.id}
              AND userId = ${auth.id}
        `;
        return Result.ok(null);
    }

    export async function withLabel(auth: Auth, labelId: string): Promise<Result<Event[]>> {
        const { err } = await Label.Server.fromId(auth, labelId);
        if (err) return Result.err(err);

        const { val: events, err: allErr } = await all(auth);
        if (allErr) return Result.err(allErr);

        return Result.ok(events.filter(evt => evt.label?.id === labelId));
    }

    export async function reassignAllLabels(
        auth: Auth,
        oldLabel: string,
        newLabel: string
    ): Promise<Result<null>> {
        await query`
            UPDATE events
            SET labelId = ${newLabel}
            WHERE labelId = ${oldLabel}
              AND userId = ${auth.id}
        `;
        return Result.ok(null);
    }

    export async function removeAllLabel(auth: Auth, labelId: string): Promise<Result<null>> {
        await query`
            UPDATE events
            SET labelId = ${null}
            WHERE labelId = ${labelId}
              AND userId = ${auth.id}
        `;
        return Result.ok(null);
    }
}

export const Event = {
    ..._Event,
    Server: EventServer
};
export type Event = _Event;
