import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth, { params }) => {
    return {
        entry: (await Entry.getFromId(auth, params.entryId, true)).unwrap(e => error(404, e))
    };
}) satisfies PageServerLoad;
