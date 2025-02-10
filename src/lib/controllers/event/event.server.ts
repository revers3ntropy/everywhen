import { Subscription } from '$lib/controllers/subscription/subscription.server';
import { UsageLimits } from '$lib/controllers/usageLimits/usageLimits.server';
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
        tzOffset: number;
        created: number;
        labelId: string | null;
    }

    export async function all(auth: Auth): Promise<Result<Event[]>> {
        const labelsRes = await Label.allIndexedById(auth);
        if (!labelsRes.ok) return labelsRes.cast();

        const rawEvents = await query<
            {
                id: string;
                name: string;
                start: number;
                end: number;
                tzOffset: number;
                labelId: string;
                created: number;
            }[]
        >`
            SELECT id,
                   name,
                   start,
                   end,
                   tzOffset,
                   labelId,
                   created
            FROM events
            WHERE userId = ${auth.id}
            ORDER BY created DESC
        `;

        return Result.collect(rawEvents.map(e => fromRaw(auth, e, labelsRes.val)));
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

        return (await Label.allIndexedById(auth)).pipe(labels => fromRaw(auth, event, labels));
    }

    export function fromRaw(
        auth: Auth,
        rawEvent: RawEvent,
        labels: Record<string, Label>
    ): Result<Event> {
        const nameDecrypted = decrypt(rawEvent.name, auth.key);
        if (!nameDecrypted.ok) return nameDecrypted.cast();

        let label: Label | null = null;
        if (rawEvent.labelId) {
            label = labels[rawEvent.labelId];
            if (!label) {
                return Result.err(`Label not found`);
            }
        }

        return Result.ok({
            id: rawEvent.id,
            name: nameDecrypted.val,
            start: rawEvent.start,
            end: rawEvent.end,
            tzOffset: rawEvent.tzOffset,
            created: rawEvent.created,
            label
        });
    }

    function eventEndTooFarInFuture(end: number): boolean {
        // max value is the year 3000 - arbitrary, could be increased
        return end > 32503680000;
    }

    function eventStartTooFarInPast(start: number): boolean {
        // before age of universe, a bit before the minimum theoretical value of a 64-bit timestamp
        return start < -4.32e17;
    }

    async function canCreateEvent(
        auth: Auth,
        name: string,
        start: number,
        end: number
    ): Promise<string | true> {
        if (name.length < UsageLimits.LIMITS.event.nameLenMin) return 'Event name too short';

        if (name.length > UsageLimits.LIMITS.event.nameLenMax) return 'Event name too long';

        if (start > end) return 'Start time cannot be after end time';
        if (eventEndTooFarInFuture(end)) return 'Too far in future';
        if (eventStartTooFarInPast(start)) return 'Too far in past';

        const [count, max] = await UsageLimits.eventUsage(
            auth,
            await Subscription.getCurrentSubscription(auth)
        );
        if (count >= max) return `Maximum number of events (${max}) reached`;

        return true;
    }

    export async function create(
        auth: Auth,
        name: string,
        start: TimestampSecs,
        end: TimestampSecs,
        tzOffset: number,
        labelId: string | null,
        created: TimestampSecs | null
    ): Promise<Result<RawEvent>> {
        const canCreate = await canCreateEvent(auth, name, start, end);
        if (canCreate !== true) return Result.err(canCreate);

        const id = await UId.generate();
        created ??= nowUtc();

        await query`
            INSERT INTO events
                (id, userId, name, start, end, tzOffset, created, labelId)
            VALUES (${id},
                    ${auth.id},
                    ${encrypt(name, auth.key)},
                    ${start},
                    ${end},
                    ${tzOffset},
                    ${created},
                    ${labelId || null})
        `;

        return Result.ok({
            id,
            created,
            name,
            start,
            end,
            tzOffset,
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
            // If trying to update start to be after end,
            // update end to be 1 hour after start
            return updateStartAndEnd(auth, self, start, start + 60 * 60);
        }
        if (eventStartTooFarInPast(start)) {
            return Result.err('Start time too far in past');
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
            // If trying to update end to be before start,
            // update start to be 1 hour before end
            return updateStartAndEnd(auth, self, end - 60 * 60, end);
        }
        if (eventEndTooFarInFuture(end)) {
            return Result.err('End time too far in future');
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
        if (start > end) return Result.err('Start time cannot be after end time');
        if (eventEndTooFarInFuture(end)) return Result.err('Too far in future');
        if (eventStartTooFarInPast(start)) return Result.err('Too far in past');

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

        await query`
            UPDATE events
            SET labelId = ${labelId}
            WHERE id = ${self.id}
              AND userId = ${auth.id}
        `;

        return (await Label.fromId(auth, labelId)).map(label => ({
            ...self,
            label
        }));
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

    export async function reassignAllLabels(
        auth: Auth,
        oldLabel: string,
        newLabel: string
    ): Promise<void> {
        await query`
            UPDATE events
            SET labelId = ${newLabel}
            WHERE labelId = ${oldLabel}
              AND userId = ${auth.id}
        `;
    }

    export async function removeAllLabel(auth: Auth, labelId: string): Promise<void> {
        await query`
            UPDATE events
            SET labelId = ${null}
            WHERE labelId = ${labelId}
              AND userId = ${auth.id}
        `;
    }

    export async function updateEncryptedFields(
        userId: string,
        oldDecrypt: (a: string) => Result<string>,
        newEncrypt: (a: string) => string
    ): Promise<Result<null[], string>> {
        const events = await query<
            {
                id: string;
                name: string;
            }[]
        >`
            SELECT id, name
            FROM events
            WHERE userId = ${userId}
        `;

        return await Result.collectAsync(
            events.map(async (event): Promise<Result<null>> => {
                const nameRes = oldDecrypt(event.name);
                if (!nameRes.ok) return nameRes.cast();

                await query`
                    UPDATE events
                    SET name = ${newEncrypt(nameRes.val)}
                    WHERE id = ${event.id}
                      AND userId = ${userId}
                `;
                return Result.ok(null);
            })
        );
    }
}

export const Event = {
    ..._Event,
    ...EventServer
};
export type Event = _Event;
