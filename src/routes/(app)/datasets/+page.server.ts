import { Settings } from '$lib/controllers/settings/settings.server';
import { error } from '@sveltejs/kit';
import { query } from '$lib/db/mysql.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';
import { Dataset } from '$lib/controllers/dataset/dataset.server';

export const load = cachedPageRoute(async auth => {
    const { val: settings, err: getSettingsErr } = await Settings.allAsMapWithDefaults(query, auth);
    if (getSettingsErr) throw error(500, getSettingsErr);

    const { val: datasets, err } = await Dataset.allMetaData(query, auth, settings);
    if (err) throw error(400, err);
    return { datasets };
}) satisfies PageServerLoad;
