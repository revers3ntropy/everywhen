import { error } from '@sveltejs/kit';
import { Location } from '$lib/controllers/location/location';
import { query } from '$lib/db/mysql.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { nowUtc } from '$lib/utils/time';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async (auth, { url }) => {
    let lat: number, lng: number;
    try {
        lat = parseFloat(url.searchParams.get('lat') || '');
    } catch (e) {
        lat = 0;
    }
    try {
        lng = parseFloat(url.searchParams.get('lon') || '');
    } catch (e) {
        lng = 0;
    }

    if (!lat || !lng) {
        const { err, val: locations } = await Location.all(query, auth);
        if (err) throw error(500, err);
        return { locations };
    }

    const { err, val: locations } = await Location.search(query, auth, lat, lng);
    if (err) throw error(500, err);
    return { ...locations };
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(
        request,
        {
            latitude: 'number',
            longitude: 'number',
            radius: 'number',
            created: 'number',
            name: 'string',
            timezoneUtcOffset: 'number'
        },
        {
            radius: 0.0001,
            created: nowUtc(),
            timezoneUtcOffset: 0
        }
    );

    const { val, err } = await Location.create(
        query,
        auth,
        body.created,
        body.timezoneUtcOffset,
        body.name,
        body.latitude,
        body.longitude,
        body.radius
    );
    if (err) throw error(400, err);

    return apiResponse(auth, { ...val });
}) satisfies RequestHandler;

export const PUT = apiRes404;
export const DELETE = apiRes404;
