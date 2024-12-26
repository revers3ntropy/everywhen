import { cachedPageRoute } from '$lib/utils/cache.server';
import { Day } from '$lib/utils/day';
import type { PageServerLoad } from './$types';
import { Entry } from '$lib/controllers/entry/entry.server';
import { By } from '$lib/controllers/stats/stats';

export const load = cachedPageRoute(async auth => {
    const start = performance.now();
    const earliestCreated = await Entry.earliestEntryCreation(auth);
    // if no earliest entry then no entries at all, so return empty stats
    if (earliestCreated === null) {
        return {
            timeOfDayData: { [By.Entries]: [], [By.Words]: [] },
            entriesByYear: { [By.Entries]: [], [By.Words]: [] },
            entriesByMonth: { [By.Entries]: [], [By.Words]: [] },
            heatmapData: { [By.Entries]: [], [By.Words]: [] },
            entryCount: 0,
            wordCount: 0,
            dayOfFirstEntry: Day.today().fmtIso(),
            loadTime: performance.now() - start
        };
    }
    const dayOfFirstEntry = Day.fromTimestamp(
        earliestCreated.created,
        earliestCreated.createdTzOffset
    );

    const { wordCount, entryCount } = await Entry.counts(auth);

    return {
        entryCount,
        wordCount,
        dayOfFirstEntry: dayOfFirstEntry.fmtIso(),
        loadTime: performance.now() - start
    };
}) satisfies PageServerLoad;
