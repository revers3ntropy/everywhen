import type { Auth } from '$lib/controllers/auth/auth';
import { Entry } from '$lib/controllers/entry/entry.server';
import type { FeedItem } from '$lib/controllers/feed/feed';
import type { FeedProvider } from '$lib/controllers/feed/feed.server';
import { query } from '$lib/db/mysql.server';
import { Day } from '$lib/utils/day';
import { Result } from '$lib/utils/result';

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
        const minTimestamp = day.utcTimestampMiddleOfDay(24);
        const maxTimestamp = day.utcTimestampMiddleOfDay(-24);
        const entries = inFuture
            ? await query<{ day: string }[]>`
                SELECT day
                FROM entries
                WHERE deleted IS NULL
                    AND userId = ${auth.id}
                    AND created > ${minTimestamp}
                    AND CONVERT(day, DATE) > CONVERT(${day.fmtIso()}, DATE)
                ORDER BY created + createdTzOffset * 60 * 60 ASC
                LIMIT 1
            `
            : await query<{ day: string }[]>`
                SELECT day
                FROM entries
                WHERE deleted IS NULL
                    AND userId = ${auth.id}
                    AND created < ${maxTimestamp}
                    AND CONVERT(day, DATE) < CONVERT(${day.fmtIso()}, DATE)
                ORDER BY created + createdTzOffset * 60 * 60 DESC
                LIMIT 1
            `;
        if (entries.length !== 1) return Result.ok(null);
        return Result.ok(Day.fromString(entries[0].day).unwrap());
    }
} satisfies FeedProvider;
