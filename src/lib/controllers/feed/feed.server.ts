import { Dataset } from '$lib/controllers/dataset/dataset.server';
import { entriesProvider } from '$lib/controllers/feed/entriesProvider';
import { entryEditsProvider } from '$lib/controllers/feed/entryEditsProvider';
import { eventEndsProvider, eventStartsProvider } from '$lib/controllers/feed/eventsProvider';
import { happinessProvider } from '$lib/controllers/feed/happinessProvidor';
import { sleepCycleProvider } from '$lib/controllers/feed/sleepCycleProvider';
import { Label } from '$lib/controllers/label/label.server';
import {
    OpenWeatherMapAPI,
    type WeatherForDay
} from '$lib/controllers/openWeatherMapAPI/openWeatherMapAPI.server';
import { Settings } from '$lib/controllers/settings/settings.server';
import type { Day } from '$lib/utils/day';
import { Result } from '$lib/utils/result';
import { Feed as _Feed, type FeedItem, type FeedDay } from './feed';
import { error } from '@sveltejs/kit';
import type { Auth } from '$lib/controllers/auth/auth';

export interface FeedProvider {
    feedItemsOnDay(auth: Auth, day: Day): Promise<Result<FeedItem[]>>;
    nextDayWithFeedItems(auth: Auth, day: Day, inFuture: boolean): Promise<Result<Day | null>>;
}

namespace FeedServer {
    const PROVIDERS = [
        sleepCycleProvider,
        entriesProvider,
        entryEditsProvider,
        eventEndsProvider,
        eventStartsProvider,
        happinessProvider
    ];

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
            async (acc, nextRes, i): Promise<Day | null> => {
                const accDay = await acc;
                // short circuit if the next day is tomorrow
                if (accDay !== null && accDay.eq(tomorrow)) return accDay;
                const next = (await nextRes).unwrap(e => error(400, e));

                if (next && !next.gt(day)) {
                    console.log({ day, next, i, accDay });
                    throw new Error('Next day is in the past!');
                }
                console.log('NEXT$ ', next, 'ACC$ ', accDay);

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

    async function weatherDataForDay(auth: Auth, day: Day): Promise<Result<WeatherForDay>> {
        if (!(await Dataset.hasDatasetWithPresetId(auth, 'weather')))
            return Result.err('Invalid day');
        const setting = await Settings.getValue(auth, 'homeLocation');
        if (!setting.ok) return setting.cast();
        const [lon, lat] = setting.val;
        if (lat === null || lon === null) return Result.err('No home location set');
        return OpenWeatherMapAPI.getWeatherForDay(day, lat, lon);
    }

    export async function getDay(auth: Auth, day: Day): Promise<Result<FeedDay>> {
        const labels = await Label.allIndexedById(auth);
        if (!labels.ok) return labels.cast();

        const [items, nextDayInPast, nextDayInFuture, weather] = await Promise.all([
            Result.collectAsync(PROVIDERS.map(p => p.feedItemsOnDay(auth, day))).then(r =>
                r
                    .map(items => items.flat())
                    .map(Feed.orderedFeedItems)
                    .unwrap(e => error(400, e))
            ),
            getNextDayInPast(auth, day).then(d => d?.fmtIso() ?? null),
            getNextDayInFuture(auth, day).then(d => d?.fmtIso() ?? null),
            // .or(null) throws away any errors generated,
            // the user will see no weather rather than an error if
            // something goes wrong
            weatherDataForDay(auth, day).then(w => w.or(null))
        ]);

        return Result.ok({
            items,
            nextDayInPast,
            nextDayInFuture,
            day: day.fmtIso(),
            weather
        } satisfies FeedDay);
    }
}

export const Feed = {
    ...FeedServer,
    ..._Feed
};

export type Feed = _Feed;
export type { FeedDay };
