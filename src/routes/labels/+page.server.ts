import { error } from '@sveltejs/kit';
import { Label } from '../../lib/controllers/label';
import { query } from '../../lib/db/mysql';
import { cachedPageRoute } from '../../lib/utils/cache';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth) => {
    const { err, val: labels } = await Label.allWithCounts(query, auth);
    if (err) throw error(400, err);
    return { labels };
}) satisfies PageServerLoad;