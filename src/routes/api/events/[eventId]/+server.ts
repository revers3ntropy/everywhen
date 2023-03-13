import { error } from '@sveltejs/kit';
import { Event } from '../../../../lib/controllers/event';
import { query } from '../../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../../lib/security/getAuthFromCookies';
import { getUnwrappedReqBody } from '../../../../lib/utils';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ request, params, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    if (!params.eventId) throw error(400, 'invalid event id');

    const body = await getUnwrappedReqBody(request, {
        name: 'string',
        start: 'number',
        end: 'number',
        label: 'string',
    }, {
        name: '',
        start: 0,
        end: 0,
        label: '',
    });

    const { err, val: event } = await Event.fromId(query, auth, params.eventId);
    if (err) throw error(404, err);

    if (body.name) {
        const { err } = await event.updateName(query, auth, body.name);
        if (err) throw error(400, err);
    }

    if (body.start) {
        const { err } = await event.updateStart(query, auth, body.start);
        if (err) throw error(400, err);
    }

    if (body.end) {
        const { err } = await event.updateEnd(query, auth, body.end);
        if (err) throw error(400, err);
    }

    if (body.label) {
        const { err } = await event.updateLabel(query, auth, body.label);
        if (err) throw error(400, err);
    }

    return new Response(
        JSON.stringify({ event: event.json() }),
        { status: 200 },
    );
};

export const DELETE: RequestHandler = async ({ params, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    if (!params.eventId) throw error(400, 'invalid event id');

    const { err, val: event } = await Event.fromId(query, auth, params.eventId);
    if (err) throw error(404, err);
    const { err: deleteErr } = await event.delete(query, auth);
    if (deleteErr) throw error(400, deleteErr);

    return new Response(
        JSON.stringify({}),
        { status: 200 },
    );
};