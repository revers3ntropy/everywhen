import { error } from '@sveltejs/kit';
import { Event } from '$lib/controllers/event/event.server';
import { Location } from '$lib/controllers/location/location.server';
import { Label } from '$lib/controllers/label/label.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth, { params }) => {
    const { labelId } = params;
    if (!labelId) error(404, 'Not found');

    return {
        label: (await Label.fromIdWithUsageCounts(auth, labelId)).unwrap(e => error(404, e)),
        events: (await Event.all(auth)).filter(event => event.labelId === labelId),
        labels: await Label.allIndexedById(auth),
        locations: (await Location.all(auth)).unwrap(e => error(400, e))
    };
}) satisfies PageServerLoad;
