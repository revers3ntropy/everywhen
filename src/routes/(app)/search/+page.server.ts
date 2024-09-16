import { error } from '@sveltejs/kit';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';
import { Location } from '$lib/controllers/location/location.server';
import { Label } from '$lib/controllers/label/label.server';

export const load = cachedPageRoute(async (auth, { parent }) => {
    await parent();

    return {
        locations: (await Location.all(auth)).unwrap(e => error(400, e)),
        labels: (await Label.allIndexedById(auth)).unwrap(e => error(400, e))
    };
}) satisfies PageServerLoad;
