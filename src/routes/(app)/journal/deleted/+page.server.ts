import { Label } from '$lib/controllers/label/label.server';
import { Location } from '$lib/controllers/location/location.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async auth => {
    return {
        locations: await Location.all(auth),
        labels: await Label.allIndexedById(auth)
    };
}) satisfies PageServerLoad;
