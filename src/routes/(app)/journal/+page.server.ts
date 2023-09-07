import type { EntrySummary } from '$lib/controllers/entry/entry';
import { Entry } from '$lib/controllers/entry/entry.server';
import { error } from '@sveltejs/kit';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';
import { Dataset } from '$lib/controllers/dataset/dataset.server';
import { Location } from '$lib/controllers/location/location.server';

export const load = cachedPageRoute(async (auth, { parent, locals }) => {
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
    const locations = (await Location.Server.all(auth)).unwrap(err => error(400, err));

    return {
        nYearsAgo,
        pinnedEntriesList,
        datasets,
        locations
    };
}) satisfies PageServerLoad;
