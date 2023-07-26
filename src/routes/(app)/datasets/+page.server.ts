import { error } from '@sveltejs/kit';
import { query } from '$lib/db/mysql.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';
import { Dataset } from "$lib/controllers/dataset/dataset.server";

export const load = cachedPageRoute(async auth => {
    const { val: datasets, err } = await Dataset.allMetaData(query, auth);
    if (err) throw error(400, err);
    return { datasets };
}) satisfies PageServerLoad;
