import { Label } from '$lib/controllers/label/label.server';
import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { Location } from '$lib/controllers/location/location.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async auth => {
    return {
        entries: (await Entry.all(auth, { onlyWithLocation: true }))
            .unwrap(e => error(400, e))
            .map(e => ({
                created: e.created,
                createdTzOffset: e.createdTzOffset,
                id: e.id,
                latitude: e.latitude,
                longitude: e.longitude
            })),
        locations: (await Location.all(auth)).unwrap(e => error(400, e)),
        labels: await Label.all(auth)
    };
}) satisfies PageServerLoad;
