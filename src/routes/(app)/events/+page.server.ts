import { error } from '@sveltejs/kit';
import { Event } from '$lib/controllers/event/event.server';
import { Label } from '$lib/controllers/label/label.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async auth => {
    const { val: events, err } = await Event.Server.all(auth);
    if (err) throw error(400, err);

    const { err: labelsErr, val: labels } = await Label.Server.all(auth);
    if (labelsErr) throw error(400, labelsErr);

    return {
        events,
        labels
    };
}) satisfies PageServerLoad;
