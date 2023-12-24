import { entriesProvider } from '$lib/controllers/feed/entriesProvider';
import { eventEndsProvider, eventStartsProvider } from '$lib/controllers/feed/eventsProvider';
import { sleepCycleProvider } from '$lib/controllers/feed/sleepCycleProvider';
import { Label } from '$lib/controllers/label/label.server';
import { decrypt } from '$lib/utils/encryption';
import { Result } from '$lib/utils/result';
import { Feed as _Feed, type FeedItem, type FeedDay } from './feed';
import type { Day } from '$lib/utils/time';
import { error } from '@sveltejs/kit';
import type { Auth } from '$lib/controllers/auth/auth';
import { query } from '$lib/db/mysql.server';

export interface FeedProvider {
    feedItemsOnDay(auth: Auth, day: Day): Promise<Result<FeedItem[]>>;
    nextDayWithFeedItems(auth: Auth, day: Day, inFuture: boolean): Promise<Result<Day | null>>;
}

namespace FeedServer {
    const PROVIDERS = [sleepCycleProvider, entriesProvider, eventEndsProvider, eventStartsProvider];

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
                .map(({ rowJson }) => decrypt(rowJson, auth.key).or(null))
                .filter((v): v is string => v !== null)
                .map(rowJson => Result.tryJsonParse<[number]>(rowJson).or(null))
                .filter((v): v is [number] => v !== null)
                .reduce((sum, value) => sum + value[0], 0) / happinesses.length
        );
    }

    async function getNextDayInPast(auth: Auth, day: Day): Promise<Day | null> {
        const yesterday = day.plusDays(-1);
        return await PROVIDERS.map(p => p.nextDayWithFeedItems(auth, day, false)).reduce(
            async (acc, nextRes): Promise<Day | null> => {
                const accDay = await acc;
                // short circuit if the next day is yesterday
                if (accDay !== null && accDay.eq(yesterday)) return accDay;
                const next = (await nextRes).unwrap(e => error(400, e));

                // treat null as Infinity
                if (next === null) return accDay;
                if (accDay === null) return next;

                // if the next day is closer to today than the current closest day,
                // return the next day (less than as all dates are assumed in past)
                if (next.lt(accDay)) return accDay;
                return next;
            },
            Promise.resolve<null | Day>(null)
        );
    }

    async function getNextDayInFuture(auth: Auth, day: Day): Promise<Day | null> {
        const tomorrow = day.plusDays(1);
        return await PROVIDERS.map(p => p.nextDayWithFeedItems(auth, day, true)).reduce(
            async (acc, nextRes): Promise<Day | null> => {
                const accDay = await acc;
                // short circuit if the next day is tomorrow
                if (accDay !== null && accDay.eq(tomorrow)) return accDay;
                const next = (await nextRes).unwrap(e => error(400, e));

                // treat null as Infinity
                if (next === null) return accDay;
                if (accDay === null) return next;

                // if the next day is closer to today than the current closest day
                if (next.lt(accDay)) return next;
                return accDay;
            },
            Promise.resolve<null | Day>(null)
        );
    }

    export async function getDay(auth: Auth, day: Day): Promise<Result<FeedDay>> {
        const labels = await Label.allIndexedById(auth);
        if (!labels.ok) return labels.cast();
        return Result.ok({
            items: (await Result.collectAsync(PROVIDERS.map(p => p.feedItemsOnDay(auth, day))))
                .map(items => items.flat())
                .map(Feed.orderedFeedItems)
                .unwrap(e => error(400, e)),
            happiness: await happinessForDay(auth, day),
            nextDayInPast: (await getNextDayInPast(auth, day))?.fmtIso() ?? null,
            nextDayInFuture: (await getNextDayInFuture(auth, day))?.fmtIso() ?? null,
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
