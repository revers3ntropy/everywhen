import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import { GETParamIsTruthy } from '$lib/utils/GETArgs';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth, { params, url }) => {
    const entry = (await Entry.getFromId(auth, params.entryId, false)).unwrap(e => error(404, e));
    return {
        entry,
        showHistory: GETParamIsTruthy(url.searchParams.get('history'))
    };
}) satisfies PageServerLoad;
