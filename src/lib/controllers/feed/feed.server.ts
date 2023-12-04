import { Label } from '$lib/controllers/label/label.server';
import { Result } from '$lib/utils/result';
import { Feed as _Feed } from './feed';
import type { FeedDay, FeedItem } from './feed';
import type { Day } from '$lib/utils/time';
import { Entry } from '$lib/controllers/entry/entry.server';
import { Event } from '$lib/controllers/event/event.server';
import { error } from '@sveltejs/kit';
import type { Auth } from '$lib/controllers/auth/auth';
import { query } from '$lib/db/mysql.server';

namespace FeedServer {
    async function happinessForDay(auth: Auth, day: Day): Promise<number | null> {
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
        if (happinesses.length === 0) return null;
        return (
            happinesses
                .map(({ rowJson }) => (JSON.parse(rowJson) as [number])[0])
                .reduce((sum, value) => sum + value, 0) / happinesses.length
        );
    }

    async function sleepsOnDay(auth: Auth, day: Day): Promise<FeedItem[]> {
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
        return sleeps.map(item => {
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
    }

    async function eventsOnDay(
        auth: Auth,
        day: Day,
        labels: Record<string, Label>
    ): Promise<Result<FeedItem[]>> {
        const rawEventsStartingOnDay = await query<
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
                AND DATE_FORMAT(FROM_UNIXTIME(start), '%Y-%m-%d') = ${day.fmtIso()}
        `;
        const rawEventsEndingOnDay = await query<
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
                AND DATE_FORMAT(FROM_UNIXTIME(end), '%Y-%m-%d') = ${day.fmtIso()}
        `;

        const eventsStartingOnDay = Result.collect(
            rawEventsStartingOnDay.map(e => Event.fromRaw(auth, e, labels))
        ).map(events => events.map(e => ({ ...e, type: 'event-start' as const })));
        if (!eventsStartingOnDay.ok) return eventsStartingOnDay.cast();
        const eventsEndingOnDay = Result.collect(
            rawEventsEndingOnDay.map(e => Event.fromRaw(auth, e, labels))
        ).map(events => events.map(e => ({ ...e, id: `${e.id}-end`, type: 'event-end' as const })));
        if (!eventsEndingOnDay.ok) return eventsEndingOnDay.cast();
        return Result.ok([
            ...eventsStartingOnDay.val,
            ...eventsEndingOnDay.val
        ] satisfies FeedItem[]);
    }

    export async function getDay(auth: Auth, day: Day): Promise<Result<FeedDay>> {
        const entries = await Entry.onDay(auth, day);
        if (!entries.ok) return entries.cast();
        const labels = await Label.allIndexedById(auth);
        if (!labels.ok) return labels.cast();
        return Result.ok({
            items: Feed.orderedFeedItems([
                ...(await sleepsOnDay(auth, day)),
                ...entries.val.map(e => ({ ...e, type: 'entry' as const })),
                ...(await eventsOnDay(auth, day, labels.val)).unwrap(e => error(500, e))
            ]),
            happiness: await happinessForDay(auth, day),
            nextDayInPast:
                (
                    await Entry.dayOfEntryBeforeThisOne(
                        auth,
                        [...entries.val].sort(Entry.compareLocalTimes)[0]
                    )
                )?.fmtIso() ?? null,
            day: day.fmtIso()
        } satisfies FeedDay);
    }
}

export const Feed = {
    ...FeedServer,
    ..._Feed
};

export type Feed = _Feed;
export type { FeedDay };
