import { error } from '@sveltejs/kit';
import { Asset } from '$lib/controllers/asset';
import { query } from '$lib/db/mysql';
import { cachedPageRoute } from '$lib/utils/cache';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async auth => {
    const { err, val } = await Asset.pageOfMetaData(query, auth, 0, 4);
    if (err) throw error(500, err);

    return { assets: val[0], assetCount: val[1] };
}) satisfies PageServerLoad;
