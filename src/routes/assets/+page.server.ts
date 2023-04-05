import { error } from '@sveltejs/kit';
import { cachedPageRoute } from '../../hooks.server';
import { Asset } from '../../lib/controllers/asset';
import { query } from '../../lib/db/mysql';
import type { PageServerLoad } from './$types';


export const load = cachedPageRoute(async (auth) => {
    const {
        err,
        val: assets,
    } = await Asset.allMetadata(query, auth);
    if (err) return error(500, err);

    return { assets };
}) satisfies PageServerLoad;
