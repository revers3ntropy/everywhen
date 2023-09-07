import { error } from '@sveltejs/kit';
import { Location } from '$lib/controllers/location/location.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { nowUtc } from '$lib/utils/time';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async (auth, { url }) => {
    const lat = parseFloat(url.searchParams.get('lat') || '');
    const lng = parseFloat(url.searchParams.get('lon') || '');

    if ((!lat && lat !== 0) || (!lng && lng !== 0)) {
        return { locations: (await Location.Server.all(auth)).unwrap(e => error(500, e)) };
    }

    return {
        ...(await Location.Server.search(auth, lat, lng)).unwrap(e => error(500, e))
    };
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(
        auth,
        request,
        {
            latitude: 'number',
            longitude: 'number',
            radius: 'number',
            created: 'number',
            name: 'string'
        },
        {
            radius: 0.0001,
            created: nowUtc()
        }
    );

    return apiResponse(auth, {
        ...(
            await Location.Server.create(
                auth,
                body.created,
                body.name,
                body.latitude,
                body.longitude,
                body.radius
            )
        ).unwrap(e => error(400, e))
    });
}) satisfies RequestHandler;

export const PUT = apiRes404;
export const DELETE = apiRes404;
