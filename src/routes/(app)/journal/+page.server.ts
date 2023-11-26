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
    if (!settings) throw error(500, 'User settings not found');

    return {
        nYearsAgo: settings.showNYearsAgoEntryTitles.value
            ? (await Entry.getSummariesNYearsAgo(auth)).unwrap(e => error(400, e))
            : ({} as Record<string, EntrySummary[]>),
        pinnedEntriesList: (await Entry.getPinnedSummaries(auth)).unwrap(e => error(400, e)),
        datasets: (await Dataset.allMetaData(auth)).unwrap(e => error(400, e)),
        locations: (await Location.all(auth)).unwrap(e => error(400, e)),
        happinessDataset: await Dataset.getDatasetFromPresetId(auth, 'happiness')
    };
}) satisfies PageServerLoad;
