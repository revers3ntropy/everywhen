import { error } from '@sveltejs/kit';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';
import { Dataset } from '$lib/controllers/dataset/dataset.server';

export const load = cachedPageRoute(async auth => {
    return {
        datasets: (await Dataset.allMetaData(auth)).unwrap(e => error(400, e))
    };
}) satisfies PageServerLoad;
