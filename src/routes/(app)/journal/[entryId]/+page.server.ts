import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { Location } from '$lib/controllers/location/location.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import { GETParamIsTruthy } from '$lib/utils/GETArgs';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth, { params, url }) => {
    return {
        entry: (await Entry.getFromId(auth, params.entryId, false)).unwrap(e => error(404, e)),
        locations: (await Location.all(auth)).unwrap(e => error(500, e)),
        showHistory: GETParamIsTruthy(url.searchParams.get('history'))
    };
}) satisfies PageServerLoad;
