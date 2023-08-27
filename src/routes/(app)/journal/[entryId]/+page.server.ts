import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import { GETParamIsTruthy } from '$lib/utils/GETArgs';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth, { params, url }) => {
    const { val: entry, err } = await Entry.Server.getFromId(auth, params.entryId, false);
    if (err) throw error(404, 'Entry not found');

    return {
        entry,
        history: GETParamIsTruthy(url.searchParams.get('history'))
    };
}) satisfies PageServerLoad;
