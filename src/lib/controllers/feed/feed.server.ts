import { Label } from '$lib/controllers/label/label.server';
import { Result } from '$lib/utils/result';
import { Feed as _Feed, type FeedItem, type FeedDay } from './feed';
import type { Day } from '$lib/utils/time';
import { Entry } from '$lib/controllers/entry/entry.server';
import { error } from '@sveltejs/kit';
import type { Auth } from '$lib/controllers/auth/auth';
import { query } from '$lib/db/mysql.server';

export interface FeedProvider {
    feedItemsOnDay(
        auth: Auth,
        day: Day
    ): Promise<Result<FeedItem[]> | FeedItem[]> | Result<FeedItem[]> | FeedItem[];
    nextDayWithFeedItems(auth: Auth, day: Day): Promise<Day | null>;
}

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

    const sleepCycleProvider = {
        async feedItemsOnDay(auth: Auth, day: Day): Promise<FeedItem[]> {
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
        },
        nextDayWithFeedItems(_auth: Auth, _day: Day): Promise<Day | null> {
            return Promise.resolve(null);
        }
    } satisfies FeedProvider;

    const eventsProvider = {
        async feedItemsOnDay(auth: Auth, day: Day): Promise<Result<FeedItem[]>> {
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
            const rawEvents = [
                ...rawEventsStartingOnDay.map(e => ({ ...e, type: 'event-start' as const })),
                ...rawEventsEndingOnDay.map(e => ({
                    ...e,
                    type: 'event-end' as const,
                    id: `${e.id}-end`
                }))
            ];

            return Result.collect(
                rawEvents.map(rawEvent => {
                    return Result.ok({
                        id: rawEvent.id,
                        type: rawEvent.type,
                        start: rawEvent.start,
                        end: rawEvent.end,
                        tzOffset: rawEvent.tzOffset,
                        labelId: rawEvent.labelId,
                        nameEncrypted: rawEvent.name,
                        created: rawEvent.created
                    });
                })
            ) satisfies Result<FeedItem[]>;
        },
        nextDayWithFeedItems(_auth: Auth, _day: Day): Promise<Day | null> {
            return Promise.resolve(null);
        }
    } satisfies FeedProvider;

    export async function getDay(auth: Auth, day: Day): Promise<Result<FeedDay>> {
        const entries = await Entry.onDay(auth, day);
        if (!entries.ok) return entries.cast();
        const labels = await Label.allIndexedById(auth);
        if (!labels.ok) return labels.cast();
        return Result.ok({
            items: Feed.orderedFeedItems([
                ...(await sleepCycleProvider.feedItemsOnDay(auth, day)),
                ...entries.val.map(e => ({ ...e, type: 'entry' as const })),
                ...(await eventsProvider.feedItemsOnDay(auth, day)).unwrap(e => error(500, e))
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
