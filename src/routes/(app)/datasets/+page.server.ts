import { error } from '@sveltejs/kit';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';
import { Dataset } from '$lib/controllers/dataset/dataset.server';

export const load = cachedPageRoute(async (auth, { locals, parent }) => {
    await parent();
    const { settings } = locals;
    if (!settings) throw error(500, 'Settings not found');
    const { val: datasets, err } = await Dataset.Server.allMetaData(auth, settings);
    if (err) throw error(400, err);
    return { datasets };
}) satisfies PageServerLoad;
