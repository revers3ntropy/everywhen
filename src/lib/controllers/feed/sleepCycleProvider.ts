import type { Auth } from '$lib/controllers/auth/auth';
import type { FeedItem } from '$lib/controllers/feed/feed';
import type { FeedProvider } from '$lib/controllers/feed/feed.server';
import { query } from '$lib/db/mysql.server';
import { Result } from '$lib/utils/result';
import { Day } from '$lib/utils/time';

export const sleepCycleProvider = {
    async feedItemsOnDay(auth: Auth, day: Day): Promise<Result<FeedItem[]>> {
        const sleeps = await query<
            { rowJson: string; timestamp: number; timestampTzOffset: number; id: string }[]
        >`
            SELECT datasetRows.rowJson, datasetRows.timestamp, datasetRows.timestampTzOffset, datasetRows.id
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
    async nextDayWithFeedItems(auth: Auth, day: Day): Promise<Result<Day | null>> {
        const records = await query<{ day: string }[]>`
            SELECT DATE_FORMAT(FROM_UNIXTIME(datasetRows.timestamp + datasetRows.timestampTzOffset * 60 * 60), '%Y-%m-%d') as day
            FROM datasetRows, datasets
            WHERE datasets.id = datasetRows.datasetId
              AND datasets.userId = ${auth.id}
              AND datasetRows.userId = ${auth.id}
              AND datasets.presetId = 'sleepCycle'
              AND CONVERT(DATE_FORMAT(FROM_UNIXTIME(datasetRows.timestamp + datasetRows.timestampTzOffset * 60 * 60), '%Y-%m-%d'), DATE)
                < CONVERT(${day.fmtIso()}, DATE)
            ORDER BY timestamp DESC, datasetRows.id
            LIMIT 1
        `;
        if (!records.length) return Result.ok(null);
        return Result.ok(Day.fromString(records[0].day).unwrap());
    }
} satisfies FeedProvider;
