import { error } from '@sveltejs/kit';
import { Asset } from '../../lib/controllers/asset';
import { query } from '../../lib/db/mysql';
import { getAuthFromCookies } from '../../lib/security/getAuthFromCookies';
import type { PageServerLoad } from './$types';


export const load = (async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const {
        err,
        val: assets,
    } = await Asset.allMetadata(query, auth);
    if (err) return error(500, err);

    return {
        assets: JSON.parse(JSON.stringify(assets)),
    };
}) satisfies PageServerLoad;
