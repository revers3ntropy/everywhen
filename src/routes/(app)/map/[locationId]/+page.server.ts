import { error } from '@sveltejs/kit';
import { Location } from '$lib/controllers/location/location.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth, { params }) => {
    const labelId = params.locationId;
    if (!labelId) throw error(404, 'Location not found');

    const { val: location, err } = await Location.Server.fromId(auth, labelId);
    if (err) throw error(404, err);

    return { location };
}) satisfies PageServerLoad;
