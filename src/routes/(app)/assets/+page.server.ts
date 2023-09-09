import { Asset } from '$lib/controllers/asset/asset.server';
import { error } from '@sveltejs/kit';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async auth => {
    const [assets, assetCount] = (await Asset.pageOfMetaData(auth, 0, 4)).unwrap(e =>
        error(500, e)
    );

    return { assets, assetCount };
}) satisfies PageServerLoad;
