import type { Auth } from '$lib/controllers/auth/auth';
import type { FeedItem } from '$lib/controllers/feed/feed';
import type { FeedProvider } from '$lib/controllers/feed/feed.server';
import { query } from '$lib/db/mysql.server';
import { Day } from '$lib/utils/day';
import { Result } from '$lib/utils/result';

export const eventStartsProvider = {
    async feedItemsOnDay(auth: Auth, day: Day): Promise<Result<FeedItem[]>> {
        const minTimestamp = day.utcTimestamp(24);
        const maxTimestamp = day.utcTimestamp(-24);
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
            SELECT id, name, start, end, tzOffset, labelId, created
            FROM events
            WHERE userId = ${auth.id}
                AND start > ${minTimestamp}
                AND start < ${maxTimestamp}
                AND DATE_FORMAT(FROM_UNIXTIME(start), '%Y-%m-%d') = ${day.fmtIso()}
        `;

        return Result.ok(
            rawEvents.map(event => ({
                id: event.id,
                type: 'event-start' as const,
                nameEncrypted: event.name,
                start: event.start,
                end: event.end,
                tzOffset: event.tzOffset,
                labelId: event.labelId,
                created: event.created
            })) satisfies FeedItem[]
        );
    },
    async nextDayWithFeedItems(
        auth: Auth,
        day: Day,
        inFuture: boolean
    ): Promise<Result<Day | null>> {
        const minTimestamp = day.utcTimestamp(24);
        const maxTimestamp = day.utcTimestamp(-24);
        const events = inFuture
            ? await query<{ start: number; tzOffset: number }[]>`
                SELECT start, tzOffset
                FROM events
                WHERE userId = ${auth.id}
                    AND start > ${minTimestamp}
                    AND CONVERT(DATE_FORMAT(FROM_UNIXTIME(start + (tzOffset - TIMESTAMPDIFF(HOUR, UTC_TIMESTAMP(), NOW())) * 60 * 60), '%Y-%m-%d'), DATE)
                        > CONVERT(${day.fmtIso()}, DATE)
                ORDER BY start + tzOffset * 60 * 60 ASC, id
                LIMIT 1
            `
            : await query<{ start: number; tzOffset: number }[]>`
                SELECT start, tzOffset
                FROM events
                WHERE userId = ${auth.id}
                  AND start < ${maxTimestamp}
                  AND CONVERT(DATE_FORMAT(FROM_UNIXTIME(start + (tzOffset - TIMESTAMPDIFF(HOUR, UTC_TIMESTAMP(), NOW())) * 60 * 60), '%Y-%m-%d'), DATE)
                        < CONVERT(${day.fmtIso()}, DATE)
                ORDER BY start + tzOffset * 60 * 60 DESC, id
                LIMIT 1
            `;
        if (!events.length) return Result.ok(null);

        const { start, tzOffset } = events[0];
        return Result.ok(Day.fromTimestamp(start, tzOffset));
    }
} satisfies FeedProvider;

export const eventEndsProvider = {
    async feedItemsOnDay(auth: Auth, day: Day): Promise<Result<FeedItem[]>> {
        const minTimestamp = day.utcTimestamp(24);
        const maxTimestamp = day.utcTimestamp(-24);
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
            SELECT id, name, start, end, tzOffset, labelId, created
            FROM events
            WHERE userId = ${auth.id}
                AND end > ${minTimestamp}
                AND end < ${maxTimestamp}
                AND DATE_FORMAT(FROM_UNIXTIME(end), '%Y-%m-%d') = ${day.fmtIso()}
        `;

        return Result.ok(
            rawEvents.map(event => ({
                id: `${event.id}-end`,
                type: 'event-end' as const,
                nameEncrypted: event.name,
                start: event.start,
                end: event.end,
                tzOffset: event.tzOffset,
                labelId: event.labelId,
                created: event.created
            })) satisfies FeedItem[]
        );
    },
    async nextDayWithFeedItems(
        auth: Auth,
        day: Day,
        inFuture: boolean
    ): Promise<Result<Day | null>> {
        const minTimestamp = day.utcTimestamp(24);
        const maxTimestamp = day.utcTimestamp(-24);
        const events = inFuture
            ? await query<{ end: number; tzOffset: number }[]>`
                SELECT end, tzOffset
                FROM events
                WHERE userId = ${auth.id}
                    AND end > ${minTimestamp}
                    AND CONVERT(DATE_FORMAT(FROM_UNIXTIME(end + (tzOffset - TIMESTAMPDIFF(HOUR, UTC_TIMESTAMP(), NOW())) * 60 * 60), '%Y-%m-%d'), DATE)
                        > CONVERT(${day.fmtIso()}, DATE)
                ORDER BY end + tzOffset * 60 * 60 ASC, id
                LIMIT 1
            `
            : await query<{ end: number; tzOffset: number }[]>`
                SELECT end, tzOffset
                FROM events
                WHERE userId = ${auth.id}
                    AND end < ${maxTimestamp}
                    AND CONVERT(DATE_FORMAT(FROM_UNIXTIME(end + (tzOffset - TIMESTAMPDIFF(HOUR, UTC_TIMESTAMP(), NOW())) * 60 * 60), '%Y-%m-%d'), DATE)
                        < CONVERT(${day.fmtIso()}, DATE)
                ORDER BY end + tzOffset * 60 * 60 DESC, id
                LIMIT 1
            `;
        if (!events.length) return Result.ok(null);
        const { end, tzOffset } = events[0];
        return Result.ok(Day.fromTimestamp(end, tzOffset));
    }
} satisfies FeedProvider;
