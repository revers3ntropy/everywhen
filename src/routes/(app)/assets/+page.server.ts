import { Asset } from '$lib/controllers/asset/asset.server';
import { error } from '@sveltejs/kit';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async auth => {
    const { err, val } = await Asset.Server.pageOfMetaData(auth, 0, 4);
    if (err) throw error(500, err);

    return { assets: val[0], assetCount: val[1] };
}) satisfies PageServerLoad;
