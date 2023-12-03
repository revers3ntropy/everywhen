import type { Feed as _Feed, FeedDay } from './feed';
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

        return {
            items: entries.map(e => ({ ...e, type: 'entry' })),
            happiness,
            nextDayInPast,
            day: day.fmtIso()
        } satisfies FeedDay;
    }
}

export const Feed = {
    ...FeedServer
};

export type Feed = _Feed;
export type { FeedDay };
