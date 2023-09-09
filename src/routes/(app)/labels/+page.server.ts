import { error } from '@sveltejs/kit';
import { Label } from '$lib/controllers/label/label.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async auth => {
    return {
        labels: (await Label.allWithCounts(auth)).unwrap(e => error(400, e))
    };
}) satisfies PageServerLoad;
