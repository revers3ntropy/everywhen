import { Dataset } from '$lib/controllers/dataset/dataset.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth, { params }) => {
    return {
        dataset: (await Dataset.getDatasetMetadata(auth, params.datasetId)).unwrap(e =>
            error(400, e)
        )
    };
}) satisfies PageServerLoad;
