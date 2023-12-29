import { Label } from '$lib/controllers/label/label.server';
import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth, { params }) => {
    return {
        entry: (await Entry.getFromId(auth, params.entryId, true)).unwrap(e => error(404, e)),
        labels: (await Label.allIndexedById(auth)).unwrap(e => error(500, e))
    };
}) satisfies PageServerLoad;
