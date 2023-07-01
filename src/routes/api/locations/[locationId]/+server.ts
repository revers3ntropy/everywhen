import { error } from '@sveltejs/kit';
import { Location } from '$lib/controllers/location/location';
import { query } from '$lib/db/mysql';
import { getAuthFromCookies } from '$lib/security/getAuthFromCookies';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse';
import { invalidateCache } from '$lib/utils/cache';
import { getUnwrappedReqBody } from '$lib/utils/requestBody';
import type { RequestHandler } from './$types';

export const GET = apiRes404;

export const PUT = (async ({ cookies, request, params }) => {
    const auth = await getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(
        request,
        {
            name: 'string',
            radius: 'number',
            latitude: 'number',
            longitude: 'number'
        },
        {
            name: '',
            radius: 0,
            latitude: 0,
            longitude: 0
        }
    );

    const { val, err } = await Location.fromId(query, auth, params.locationId);
    if (err) throw error(400, err);
    let location = val;

    if (body.name) {
        const { err, val } = await Location.updateName(query, auth, location, body.name);
        if (err) throw error(400, err);
        location = val;
    }

    if (body.radius > 0) {
        const { err, val } = await Location.updateRadius(query, auth, location, body.radius);
        if (err) throw error(400, err);
        location = val;
    }

    if (body.latitude !== 0 && body.longitude !== 0) {
        const { err } = await Location.updateLocation(
            query,
            auth,
            location,
            body.latitude,
            body.longitude
        );
        if (err) throw error(400, err);
    }

    return apiResponse({});
}) satisfies RequestHandler;

export const DELETE = (async ({ params, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    if (!params.locationId) throw error(400, 'invalid location id');
    invalidateCache(auth.id);

    const { err: deleteErr } = await Location.purge(query, auth, params.locationId);
    if (deleteErr) throw error(400, deleteErr);

    return apiResponse({});
}) satisfies RequestHandler;

export const POST = apiRes404;
