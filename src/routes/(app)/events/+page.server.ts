import { error } from '@sveltejs/kit';
import { Event } from '$lib/controllers/event/event.server';
import { Label } from '$lib/controllers/label/label.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async auth => {
    return {
        events: (await Event.all(auth)).unwrap(e => error(400, e)) as (Event & {
            deleted?: boolean;
        })[],
        labels: (await Label.allIndexedById(auth)).unwrap(e => error(400, e))
    };
}) satisfies PageServerLoad;
