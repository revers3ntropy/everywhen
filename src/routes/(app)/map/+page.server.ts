import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { Location } from '$lib/controllers/location/location.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async auth => {
    const { val: entries, err } = await Entry.Server.all(auth, { onlyWithLocation: true });
    if (err) throw error(400, err);

    const { err: locationErr, val: locations } = await Location.Server.all(auth);
    if (locationErr) throw error(400, locationErr);

    return {
        entries: entries.map(e => ({
            created: e.created,
            id: e.id,
            latitude: e.latitude,
            longitude: e.longitude
        })),
        locations
    };
}) satisfies PageServerLoad;
