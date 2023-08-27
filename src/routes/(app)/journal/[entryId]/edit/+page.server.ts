import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth, { params }) => {
    const { val: entry, err } = await Entry.Server.getFromId(auth, params.entryId, true);
    if (err) throw error(404, err);

    return { entry };
}) satisfies PageServerLoad;
