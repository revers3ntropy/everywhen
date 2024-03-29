import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { Event } from '$lib/controllers/event/event.server';
import { Location } from '$lib/controllers/location/location.server';
import { Label } from '$lib/controllers/label/label.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth, { params }) => {
    const { labelId } = params;
    if (!labelId) error(404, 'Not found');

    return {
        label: (await Label.fromId(auth, labelId)).unwrap(e => error(404, e)),
        entryCount: (
            await Entry.getPage(auth, 0, 1, {
                labelId
            })
        ).unwrap(e => error(400, e))[1],
        events: (await Event.all(auth))
            .unwrap(e => error(400, e))
            .filter(event => event.label?.id === labelId),
        labels: (await Label.allIndexedById(auth)).unwrap(e => error(400, e)),
        locations: (await Location.all(auth)).unwrap(e => error(400, e))
    };
}) satisfies PageServerLoad;
