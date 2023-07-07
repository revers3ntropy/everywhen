import { error } from '@sveltejs/kit';
import { Location } from '$lib/controllers/location/location';
import { query } from '$lib/db/mysql.server';
import { getAuthFromCookies } from '$lib/security/getAuthFromCookies';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { nowUtc } from '$lib/utils/time';
import type { RequestHandler } from './$types';

export const GET = cachedApiRoute(async (auth, { url }) => {
    const lat = parseFloat(url.searchParams.get('lat') || '');
    const lon = parseFloat(url.searchParams.get('lon') || '');

    if (!lat || !lon) {
        const { err, val: locations } = await Location.all(query, auth);
        if (err) throw error(500, err);
        return { locations };
    }

    const { err, val: locations } = await Location.search(query, auth, lat, lon);
    if (err) throw error(500, err);
    return { ...locations };
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
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

    return apiResponse({ ...val });
}) satisfies RequestHandler;

export const PUT = apiRes404;
export const DELETE = apiRes404;
