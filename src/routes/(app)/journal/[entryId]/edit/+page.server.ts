import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry';
import { query } from '$lib/db/mysql.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth, { params }) => {
    const { val: entry, err } = await Entry.fromId(query, auth, params.entryId, true);
    if (err) throw error(404, err);

    return { entry };
}) satisfies PageServerLoad;
