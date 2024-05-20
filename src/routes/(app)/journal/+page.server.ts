import { Entry } from '$lib/controllers/entry/entry.server';
import { Label } from '$lib/controllers/label/label.server';
import { error } from '@sveltejs/kit';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';
import { Dataset } from '$lib/controllers/dataset/dataset.server';
import { Location } from '$lib/controllers/location/location.server';

export const load = cachedPageRoute(async (auth, { parent }) => {
    await parent();

    return {
        pinnedEntriesList: (await Entry.getPinnedSummaries(auth)).unwrap(e => error(400, e)),
        datasets: (await Dataset.allMetaData(auth)).unwrap(e => error(400, e)),
        locations: (await Location.all(auth)).unwrap(e => error(400, e)),
        happinessDataset: (await Dataset.getDatasetFromPresetId(auth, 'happiness')).unwrap(e =>
            error(400, e)
        ),
        labels: (await Label.allIndexedById(auth)).unwrap(e => error(400, e))
        //entryCountPerDay: await Entry.getEntryCountPerDay(auth)
    };
}) satisfies PageServerLoad;
