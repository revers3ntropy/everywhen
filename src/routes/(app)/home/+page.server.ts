import type { EntrySummary } from '$lib/controllers/entry/entry';
import { Entry } from '$lib/controllers/entry/entry.server';
import { error } from '@sveltejs/kit';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';
import { Dataset } from '$lib/controllers/dataset/dataset.server';

const NUMBER_OF_RECENT_TITLES = 6;

export const load = cachedPageRoute(async (auth, { parent, locals }) => {
    const { val: summaries, err } = await Entry.Server.getPageOfSummaries(
        auth,
        NUMBER_OF_RECENT_TITLES,
        0
    );
    if (err) throw error(400, err);

    const firstNTitles = Entry.groupEntriesByDay(summaries.summaries);

    await parent();

    const { settings } = locals;
    if (!settings) throw error(500, 'Settings not found');

    let nYearsAgo = {} as Record<string, EntrySummary[]>;
    if (settings.showNYearsAgoEntryTitles.value) {
        nYearsAgo = (await Entry.Server.getSummariesNYearsAgo(auth)).unwrap(err => error(400, err));
    }

    const pinnedEntriesList = (await Entry.Server.getPinnedSummaries(auth)).unwrap(err =>
        error(400, err)
    );

    const datasets = (await Dataset.Server.allMetaData(auth)).unwrap(err => error(400, err));

    return {
        recentTitles: firstNTitles,
        nYearsAgo,
        pinnedEntriesList,
        datasets
    };
}) satisfies PageServerLoad;
