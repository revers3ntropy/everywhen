import { error } from '@sveltejs/kit';
import { Event } from '$lib/controllers/event/event.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const PUT = (async ({ request, params, cookies }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    if (!params.eventId) throw error(400, 'invalid event id');
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(
        auth,
        request,
        {
            name: 'string',
            start: 'number',
            end: 'number',
            label: 'string'
        },
        {
            name: '',
            start: 0,
            end: 0,
            // not a very nice solution, make sure this
            // can't be used as a valid ID
            label: 'NO_CHANGE'
        }
    );

    const { err, val: event } = await Event.Server.fromId(auth, params.eventId);
    if (err) throw error(404, err);

    if (body.name) {
        const { err } = await Event.Server.updateName(auth, event, body.name);
        if (err) throw error(400, err);
    }

    // deal with differently because otherwise you have to do one first,
    // which always means one of them will be 'before'/'after' the other,
    // which is caught by the validation in the controller
    if (body.start && body.end) {
        const { err } = await Event.Server.updateStartAndEnd(auth, event, body.start, body.end);
        if (err) throw error(400, err);
    } else {
        if (body.start) {
            const { err } = await Event.Server.updateStart(auth, event, body.start);
            if (err) throw error(400, err);
        }

        if (body.end) {
            const { err } = await Event.Server.updateEnd(auth, event, body.end);
            if (err) throw error(400, err);
        }
    }

    if (body.label !== 'NO_CHANGE') {
        const { err } = await Event.Server.updateLabel(auth, event, body.label);
        if (err) throw error(400, err);
    }

    return apiResponse(auth, { event });
}) satisfies RequestHandler;

export const DELETE = (async ({ params, cookies }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    if (!params.eventId) throw error(400, 'invalid event id');
    invalidateCache(auth.id);

    const { err, val: event } = await Event.Server.fromId(auth, params.eventId);
    if (err) throw error(404, err);
    const { err: deleteErr } = await Event.Server.purge(auth, event);
    if (deleteErr) throw error(400, deleteErr);

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const GET = apiRes404;
export const POST = apiRes404;
