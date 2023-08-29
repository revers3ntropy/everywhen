import { error } from '@sveltejs/kit';
import { Location } from '$lib/controllers/location/location.server';

import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = apiRes404;

export const PUT = (async ({ cookies, request, params }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(
        auth,
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

    const { val, err } = await Location.Server.fromId(auth, params.locationId);
    if (err) throw error(400, err);
    let location = val;

    if (body.name) {
        const { err, val } = await Location.Server.updateName(auth, location, body.name);
        if (err) throw error(400, err);
        location = val;
    }

    if (body.radius > 0) {
        const { err, val } = await Location.Server.updateRadius(auth, location, body.radius);
        if (err) throw error(400, err);
        location = val;
    }

    if (body.latitude !== 0 && body.longitude !== 0) {
        const { err } = await Location.Server.updateLocation(
            auth,
            location,
            body.latitude,
            body.longitude
        );
        if (err) throw error(400, err);
    }

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const DELETE = (async ({ params, cookies }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    if (!params.locationId) throw error(400, 'invalid location id');
    invalidateCache(auth.id);

    const { err: deleteErr } = await Location.Server.purge(auth, params.locationId);
    if (deleteErr) throw error(400, deleteErr);

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const POST = apiRes404;
