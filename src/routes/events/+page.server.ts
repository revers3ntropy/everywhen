import { error } from '@sveltejs/kit';
import { Event } from '../../lib/controllers/event';
import { Label } from '../../lib/controllers/label';
import { query } from '../../lib/db/mysql';
import { cachedPageRoute } from '../../lib/utils/cache';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth) => {
    const { val: events, err } = await Event.all(query, auth);
    if (err) throw error(400, err);

    const { err: labelsErr, val: labels } = await Label.all(query, auth);
    if (labelsErr) throw error(400, labelsErr);

    return {
        events,
        labels,
    };
}) satisfies PageServerLoad;