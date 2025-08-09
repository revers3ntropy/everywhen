import { error } from '@sveltejs/kit';
import { Location } from '$lib/controllers/location/location.server';
import { api404Handler, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { nowUtc } from '$lib/utils/time';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async (auth, { url }) => {
    const lat = parseFloat(url.searchParams.get('lat') || '');
    const lng = parseFloat(url.searchParams.get('lon') || '');

    if ((!lat && lat !== 0) || (!lng && lng !== 0)) {
        return { locations: await Location.all(auth) };
    }

    return {
        ...(await Location.search(auth, lat, lng)).unwrap(e => error(500, e))
    };
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth, request, {
        latitude: z.number(),
        longitude: z.number(),
        radius: z.number().optional(),
        created: z.number().optional(),
        name: z.string()
    });

    return apiResponse(auth, {
        ...(
            await Location.create(
                auth,
                body.created ?? nowUtc(),
                body.name,
                body.latitude,
                body.longitude,
                body.radius ?? 0.0001
            )
        ).unwrap(e => error(400, e))
    });
}) satisfies RequestHandler;

export const PUT = api404Handler;
export const DELETE = api404Handler;
