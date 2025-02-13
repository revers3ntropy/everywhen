import { Label } from '$lib/controllers/label/label.server';
import { error } from '@sveltejs/kit';
import { Location } from '$lib/controllers/location/location.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth, { params }) => {
    const labelId = params.locationId;
    if (!labelId) error(404, 'Location not found');

    const locations = (await Location.all(auth)).unwrap(e => error(500, e));
    const location = locations.find(l => l.id === labelId);
    if (!location) error(404, 'Location not found');

    return {
        location,
        locations,
        labels: await Label.allIndexedById(auth)
    };
}) satisfies PageServerLoad;
