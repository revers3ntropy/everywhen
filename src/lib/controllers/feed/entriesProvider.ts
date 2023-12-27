import type { Auth } from '$lib/controllers/auth/auth';
import { Entry } from '$lib/controllers/entry/entry.server';
import type { FeedItem } from '$lib/controllers/feed/feed';
import type { FeedProvider } from '$lib/controllers/feed/feed.server';
import { query } from '$lib/db/mysql.server';
import { Result } from '$lib/utils/result';
import { Day } from '$lib/utils/time';

export const entriesProvider = {
    async feedItemsOnDay(auth: Auth, day: Day): Promise<Result<FeedItem[]>> {
        return (await Entry.onDay(auth, day)).map(entries =>
            entries.map(e => ({ ...e, type: 'entry' as const }))
        );
    },
    async nextDayWithFeedItems(
        auth: Auth,
        day: Day,
        inFuture: boolean
    ): Promise<Result<Day | null>> {
        const estimateMinTimestamp = day.utcTimestamp(24);
        const estimateMaxTimestamp = day.utcTimestamp(-24);
        const estimate = inFuture
            ? await query<{ estimateTimestamp: number }[]>`
                SELECT MIN(created) as estimateTimestamp
                FROM entries
                USE INDEX (idx_entries_userId_created_deleted)
                WHERE deleted IS NULL
                    AND userId = ${auth.id}
                    AND created > ${estimateMinTimestamp}
            `
            : await query<{ estimateTimestamp: number }[]>`
                SELECT MAX(created) as estimateTimestamp
                FROM entries
                USE INDEX (idx_entries_userId_created_deleted)
                WHERE deleted IS NULL
                    AND userId = ${auth.id}
                    AND created < ${estimateMaxTimestamp}
            `;
        if (estimate.length !== 1) return Result.ok(null);

        const minTimestamp = estimate[0].estimateTimestamp - 60 * 60 * 24 * 2;
        const maxTimestamp = estimate[0].estimateTimestamp + 60 * 60 * 24 * 2;
        const entries = inFuture
            ? await query<{ day: string }[]>`
                SELECT DATE_FORMAT(FROM_UNIXTIME(created + createdTzOffset * 60 * 60), '%Y-%m-%d') as day
                FROM entries
                WHERE deleted IS NULL
                    AND userId = ${auth.id}
                    AND created > ${minTimestamp}
                    AND created < ${maxTimestamp}
                    AND CONVERT(DATE_FORMAT(FROM_UNIXTIME(created + createdTzOffset * 60 * 60), '%Y-%m-%d'), DATE)
                        > CONVERT(${day.fmtIso()}, DATE)
                ORDER BY created + createdTzOffset * 60 * 60 ASC
                LIMIT 1
            `
            : await query<{ day: string }[]>`
                SELECT DATE_FORMAT(FROM_UNIXTIME(created + createdTzOffset * 60 * 60), '%Y-%m-%d') as day
                FROM entries
                WHERE deleted IS NULL
                    AND userId = ${auth.id}
                    AND created > ${minTimestamp}
                    AND created < ${maxTimestamp}
                    AND CONVERT(DATE_FORMAT(FROM_UNIXTIME(created + createdTzOffset * 60 * 60), '%Y-%m-%d'), DATE)
                        < CONVERT(${day.fmtIso()}, DATE)
                ORDER BY created + createdTzOffset * 60 * 60 DESC
                LIMIT 1
            `;
        if (entries.length !== 1) return Result.ok(null);
        return Result.ok(Day.fromString(entries[0].day).unwrap());
    }
} satisfies FeedProvider;
