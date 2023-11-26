import { cachedPageRoute } from '$lib/utils/cache.server';
import { daysSince } from '$lib/utils/time';
import type { PageServerLoad } from './$types';
import { Entry } from '$lib/controllers/entry/entry.server';

export const load = cachedPageRoute(async auth => {
    const earliestCreated = await Entry.earliestEntryCreation(auth);
    if (earliestCreated === null) {
        return {
            summaries: [],
            entryCount: 0,
            commonWords: [],
            days: 0,
            wordCount: 0
        };
    }
    // should be time zone agnostic?
    const days = daysSince(earliestCreated, 0);

    const [{ wordCount, entryCount }, commonWordsArray, summaries] = await Promise.all([
        Entry.counts(auth),
        Entry.wordFrequencies(auth),
        Entry.allBasicSummaries(auth)
    ]);

    return {
        summaries,
        entryCount,
        commonWords: commonWordsArray,
        days,
        wordCount
    };
}) satisfies PageServerLoad;
