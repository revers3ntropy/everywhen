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
    async nextDayWithFeedItems(auth: Auth, day: Day): Promise<Result<Day | null>> {
        const entries = await query<{ created: number; createdTzOffset: number }[]>`
            SELECT created, createdTzOffset
            FROM entries
            WHERE deleted IS NULL
              AND userId = ${auth.id}
              AND CONVERT(DATE_FORMAT(FROM_UNIXTIME(created + createdTzOffset * 60 * 60), '%Y-%m-%d'), DATE)
               < CONVERT(${day.fmtIso()}, DATE)
            ORDER BY created DESC, id
            LIMIT 1
        `;
        if (!entries.length) return Result.ok(null);

        const { created, createdTzOffset } = entries[0];
        return Result.ok(Day.fromTimestamp(created, createdTzOffset));
    }
} satisfies FeedProvider;
