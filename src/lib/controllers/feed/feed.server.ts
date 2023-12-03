import { Feed as _Feed } from './feed';
import type { FeedDay, FeedItem } from './feed';
import type { Day } from '$lib/utils/time';
import { Entry } from '$lib/controllers/entry/entry.server';
import { error } from '@sveltejs/kit';
import type { Auth } from '$lib/controllers/auth/auth';
import { query } from '$lib/db/mysql.server';

namespace FeedServer {
    export async function getDay(auth: Auth, day: Day): Promise<FeedDay> {
        const entries = (await Entry.onDay(auth, day)).unwrap(e => error(500, e));
        const lastEntry = [...entries].sort(Entry.compareLocalTimes)[0];
        const nextDayInPast =
            (await Entry.dayOfEntryBeforeThisOne(auth, lastEntry))?.fmtIso() ?? null;

        const happinesses = await query<{ rowJson: string }[]>`
            SELECT rowJson
            FROM datasetRows, datasets
            WHERE datasets.id = datasetRows.datasetId
                AND datasets.userId = ${auth.id}
                AND datasetRows.userId = ${auth.id}
                AND datasets.presetId = 'happiness'
                AND DATE_FORMAT(FROM_UNIXTIME(datasetRows.timestamp + datasetRows.timestampTzOffset * 60 * 60), '%Y-%m-%d') 
                    = ${day.fmtIso()}
        `;
        const happiness =
            happinesses
                .map(({ rowJson }) => (JSON.parse(rowJson) as [number])[0])
                .reduce((sum, value) => sum + value, 0) / happinesses.length;

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
        const sleepItems = sleeps.map(item => {
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
        }) satisfies FeedItem[];

        const entryItems = entries.map(e => ({ ...e, type: 'entry' as const }));

        return {
            items: Feed.orderedFeedItems([...sleepItems, ...entryItems]),
            happiness,
            nextDayInPast,
            day: day.fmtIso()
        } satisfies FeedDay;
    }
}

export const Feed = {
    ...FeedServer,
    ..._Feed
};

export type Feed = _Feed;
export type { FeedDay };
