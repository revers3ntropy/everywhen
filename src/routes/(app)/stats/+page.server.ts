import { cachedPageRoute } from '$lib/utils/cache.server';
import { Day } from '$lib/utils/time';
import type { PageServerLoad } from './$types';
import { Entry } from '$lib/controllers/entry/entry.server';

export const load = cachedPageRoute(async auth => {
    const earliestCreated = await Entry.earliestEntryCreation(auth);
    if (earliestCreated === null) {
        return {
            summaries: [],
            entryCount: 0,
            commonWords: [],
            wordCount: 0,
            dayOfFirstEntry: null
        };
    }

    const [{ wordCount, entryCount }, commonWordsArray, summaries] = await Promise.all([
        Entry.counts(auth),
        Entry.wordFrequencies(auth),
        Entry.allBasicSummaries(auth)
    ]);

    return {
        summaries,
        entryCount,
        commonWords: commonWordsArray,
        wordCount,
        dayOfFirstEntry: Day.fromTimestamp(
            earliestCreated.created,
            earliestCreated.createdTzOffset
        ).fmtIso()
    };
}) satisfies PageServerLoad;
