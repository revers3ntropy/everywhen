import { error } from '@sveltejs/kit';
import { Location } from '$lib/controllers/location';
import { query } from '$lib/db/mysql';
import { cachedPageRoute } from '$lib/utils/cache';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth, { params }) => {
    const labelId = params.locationId;
    if (!labelId) throw error(404, 'Location not found');

    const { val: location, err } = await Location.fromId(query, auth, labelId);
    if (err) throw error(404, err);

    return { location };
}) satisfies PageServerLoad;
