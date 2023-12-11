import type { Auth } from '$lib/controllers/auth/auth';
import type { FeedItem } from '$lib/controllers/feed/feed';
import type { FeedProvider } from '$lib/controllers/feed/feed.server';
import { query } from '$lib/db/mysql.server';
import { Result } from '$lib/utils/result';
import type { Day } from '$lib/utils/time';

export const sleepCycleProvider = {
    async feedItemsOnDay(auth: Auth, day: Day): Promise<Result<FeedItem[]>> {
        const sleeps = await query<
            { rowJson: string; timestamp: number; timestampTzOffset: number; id: string }[]
        >`
            SELECT rowJson, timestamp, timestampTzOffset, datasetRows.id
            FROM datasetRows, datasets
            WHERE datasets.id = datasetRows.datasetId
                AND datasets.userId = ${auth.id}
                AND datasetRows.userId = ${auth.id}
                AND datasets.presetId = 'sleepCycle'
                AND DATE_FORMAT(FROM_UNIXTIME(datasetRows.timestamp + datasetRows.timestampTzOffset * 60 * 60), '%Y-%m-%d') 
                    = ${day.fmtIso()}
        `;
        return Result.ok(
            sleeps.map(item => {
                const [duration, quality, regularity] = JSON.parse(item.rowJson) as [
                    number,
                    number | null,
                    number | null
                ];
                return {
                    id: item.id,
                    type: 'sleep' as const,
                    start: item.timestamp,
                    startTzOffset: item.timestampTzOffset,
                    duration,
                    quality,
                    regularity
                };
            }) satisfies FeedItem[]
        );
    },
    nextDayWithFeedItems(_auth: Auth, _day: Day): Promise<Result<Day | null>> {
        return Promise.resolve(Result.ok(null));
    }
} satisfies FeedProvider;
