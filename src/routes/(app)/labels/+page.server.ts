import { error } from '@sveltejs/kit';
import { Label } from '$lib/controllers/label/label.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async auth => {
    const { err, val: labels } = await Label.Server.allWithCounts(auth);
    if (err) throw error(400, err);
    return { labels };
}) satisfies PageServerLoad;
