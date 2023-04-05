import { error } from '@sveltejs/kit';
import { Event } from '../../../../lib/controllers/event';
import { query } from '../../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../../lib/security/getAuthFromCookies';
import { apiRes404, apiResponse } from '../../../../lib/utils/apiResponse';
import { invalidateCache } from '../../../../lib/utils/cache';
import { getUnwrappedReqBody } from '../../../../lib/utils/requestBody';
import type { RequestHandler } from './$types';

export const PUT = (async ({ request, params, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    if (!params.eventId) throw error(400, 'invalid event id');
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(request, {
        name: 'string',
        start: 'number',
        end: 'number',
        label: 'string',
    }, {
        name: '',
        start: 0,
        end: 0,
        // not a very nice solution, make sure this
        // can't be used as a valid ID
        label: 'NO_CHANGE',
    });

    const { err, val: event } = await Event.fromId(query, auth, params.eventId);
    if (err) throw error(404, err);

    if (body.name) {
        const { err } = await Event.updateName(query, auth, event, body.name);
        if (err) throw error(400, err);
    }

    if (body.start) {
        const { err } = await Event.updateStart(query, auth, event, body.start);
        if (err) throw error(400, err);
    }

    if (body.end) {
        const { err } = await Event.updateEnd(query, auth, event, body.end);
        if (err) throw error(400, err);
    }

    if (body.label !== 'NO_CHANGE') {
        const { err } = await Event.updateLabel(query, auth, event, body.label);
        if (err) throw error(400, err);
    }

    return apiResponse({ event });
}) satisfies RequestHandler;

export const DELETE = (async ({ params, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    if (!params.eventId) throw error(400, 'invalid event id');
    invalidateCache(auth.id);

    const { err, val: event } = await Event.fromId(query, auth, params.eventId);
    if (err) throw error(404, err);
    const { err: deleteErr } = await Event.purge(query, auth, event);
    if (deleteErr) throw error(400, deleteErr);

    return apiResponse({});
}) satisfies RequestHandler;

export const GET = apiRes404;
export const POST = apiRes404;
