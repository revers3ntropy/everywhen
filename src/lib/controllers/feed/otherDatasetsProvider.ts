import type { Auth } from '$lib/controllers/auth/auth';
import type { FeedItem } from '$lib/controllers/feed/feed';
import type { FeedProvider } from '$lib/controllers/feed/feed.server';
import { query } from '$lib/db/mysql.server';
import { Day } from '$lib/utils/day';
import { Result } from '$lib/utils/result';
import { Dataset } from '$lib/controllers/dataset/dataset.server';

export const otherDatasetsProvider = {
    async feedItemsOnDay(auth: Auth, day: Day): Promise<Result<FeedItem[]>> {
        const minTimestamp = day.utcTimestampMiddleOfDay(24);
        const maxTimestamp = day.utcTimestampMiddleOfDay(-24);
        const rows = await query<
            {
                rowJson: string;
                timestamp: number;
                timestampTzOffset: number;
                id: string;
                datasetId: string;
                datasetName: string;
            }[]
        >`
            SELECT 
                datasetRows.rowJson,
                datasetRows.timestamp,
                datasetRows.timestampTzOffset,
                datasetRows.id,
                datasetRows.datasetId,
                datasets.name as datasetName
            FROM datasetRows, datasets
            WHERE datasets.id = datasetRows.datasetId
                AND datasets.userId = ${auth.id}
                AND datasetRows.userId = ${auth.id}
                AND datasets.showInFeed = true
                AND datasetRows.timestamp > ${minTimestamp}
                AND datasetRows.timestamp < ${maxTimestamp}
                AND DATE_FORMAT(FROM_UNIXTIME(datasetRows.timestamp + (datasetRows.timestampTzOffset - TIMESTAMPDIFF(HOUR, UTC_TIMESTAMP(), NOW())) * 60 * 60), '%Y-%m-%d') 
                    = ${day.fmtIso()}
        `;
        const columns = await Dataset.getUserDefinedColumnsByDatasetOrderedForJson(auth);
        if (!columns.ok) return columns.cast();
        return Result.ok(
            rows.map(item => {
                return {
                    type: 'otherDataset' as const,
                    id: item.id,
                    timestamp: item.timestamp,
                    timestampTzOffset: item.timestampTzOffset,
                    datasetName: item.datasetName,
                    datasetId: item.datasetId,
                    rowJson: item.rowJson,
                    columns: columns.val[item.datasetId].map(c => ({
                        name: c.name,
                        ordering: c.ordering,
                        jsonOrdering: c.jsonOrdering
                    }))
                } satisfies FeedItem;
            })
        );
    },

    async nextDayWithFeedItems(
        auth: Auth,
        day: Day,
        inFuture: boolean
    ): Promise<Result<Day | null>> {
        const minTimestamp = day.utcTimestampMiddleOfDay(24);
        const maxTimestamp = day.utcTimestampMiddleOfDay(-24);
        const records = inFuture
            ? await query<{ day: string }[]>`
                SELECT DATE_FORMAT(FROM_UNIXTIME(datasetRows.timestamp + (datasetRows.timestampTzOffset - TIMESTAMPDIFF(HOUR, UTC_TIMESTAMP(), NOW())) * 60 * 60), '%Y-%m-%d') as day
                FROM datasetRows, datasets
                WHERE datasets.id = datasetRows.datasetId
                  AND datasets.userId = ${auth.id}
                  AND datasetRows.userId = ${auth.id}
                  AND datasets.showInFeed = true
                  AND datasetRows.timestamp > ${minTimestamp}
                  AND CONVERT(DATE_FORMAT(FROM_UNIXTIME(datasetRows.timestamp + (datasetRows.timestampTzOffset - TIMESTAMPDIFF(HOUR, UTC_TIMESTAMP(), NOW())) * 60 * 60), '%Y-%m-%d'), DATE)
                    > CONVERT(${day.fmtIso()}, DATE)
                ORDER BY datasetRows.timestamp + datasetRows.timestampTzOffset * 60 * 60 ASC, datasetRows.id
                LIMIT 1
            `
            : await query<{ day: string }[]>`
                SELECT DATE_FORMAT(FROM_UNIXTIME(datasetRows.timestamp + (datasetRows.timestampTzOffset - TIMESTAMPDIFF(HOUR, UTC_TIMESTAMP(), NOW())) * 60 * 60), '%Y-%m-%d') as day
                FROM datasetRows, datasets
                WHERE datasets.id = datasetRows.datasetId
                  AND datasets.userId = ${auth.id}
                  AND datasetRows.userId = ${auth.id}
                  AND datasets.showInFeed = true
                  AND datasetRows.timestamp < ${maxTimestamp}
                  AND CONVERT(DATE_FORMAT(FROM_UNIXTIME(datasetRows.timestamp + (datasetRows.timestampTzOffset - TIMESTAMPDIFF(HOUR, UTC_TIMESTAMP(), NOW())) * 60 * 60), '%Y-%m-%d'), DATE)
                    < CONVERT(${day.fmtIso()}, DATE)
                ORDER BY datasetRows.timestamp + datasetRows.timestampTzOffset * 60 * 60 DESC, datasetRows.id
                LIMIT 1
            `;
        if (!records.length) return Result.ok(null);
        return Result.ok(Day.fromString(records[0].day).unwrap());
    }
} satisfies FeedProvider;
