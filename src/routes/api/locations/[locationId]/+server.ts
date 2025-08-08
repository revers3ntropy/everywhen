import { error } from '@sveltejs/kit';
import { Location } from '$lib/controllers/location/location.server';

import { api404Handler, apiResponse } from '$lib/utils/apiResponse.server';
import { invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = api404Handler;

export const PUT = (async ({ cookies, request, params }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth, request, {
        name: z.string().optional(),
        radius: z.number().min(0).max(360).optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional()
    });

    let location = (await Location.fromId(auth, params.locationId)).unwrap(e => error(400, e));

    if (body.name) {
        location = (await Location.updateName(auth, location, body.name)).unwrap(e =>
            error(400, e)
        );
    }

    if (body.radius && body.radius > 0) {
        location = (await Location.updateRadius(auth, location, body.radius)).unwrap(e =>
            error(400, e)
        );
    }

    if (typeof body.latitude === 'number' && typeof body.longitude === 'number') {
        (await Location.updateLocation(auth, location, body.latitude, body.longitude)).unwrap(e =>
            error(400, e)
        );
    }

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const DELETE = (async ({ params, cookies }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    if (!params.locationId) error(400, 'invalid location id');
    invalidateCache(auth.id);

    (await Location.purge(auth, params.locationId)).unwrap(e => error(400, e));

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const POST = api404Handler;
