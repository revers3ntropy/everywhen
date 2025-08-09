import { error } from '@sveltejs/kit';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';
import { Label } from '$lib/controllers/label/label.server';
import { Location } from '$lib/controllers/location/location.server';

export const load = cachedPageRoute(async (auth, { params }) => {
    const labelId = params.locationId;
    if (!labelId) error(404, 'Location not found');

    const locations = await Location.all(auth);
    const location = locations.find(l => l.id === labelId);
    if (!location) error(404, 'Location not found');

    return {
        location,
        labels: await Label.allIndexedById(auth),
        locations
    };
}) satisfies PageServerLoad;
