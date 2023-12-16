import { error } from '@sveltejs/kit';
import { Event } from '$lib/controllers/event/event.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const PUT = (async ({ request, params, cookies }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    if (!params.eventId) error(400, 'invalid event id');
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth, request, {
        name: z.string().optional(),
        start: z.number().optional(),
        end: z.number().optional(),
        label: z.string().optional().nullable()
    });

    const event = (await Event.fromId(auth, params.eventId)).unwrap(e => error(404, e));

    if (body.name) {
        (await Event.updateName(auth, event, body.name)).unwrap(e => error(400, e));
    }

    // deal with differently because otherwise you have to do one first,
    // which always means one of them will be 'before'/'after' the other,
    // which is caught by the validation in the controller
    if (body.start && body.end) {
        (await Event.updateStartAndEnd(auth, event, body.start, body.end)).unwrap(e =>
            error(400, e)
        );
    } else {
        if (body.start) {
            (await Event.updateStart(auth, event, body.start)).unwrap(e => error(400, e));
        }

        if (body.end) {
            (await Event.updateEnd(auth, event, body.end)).unwrap(e => error(400, e));
        }
    }

    if (body.label !== undefined) {
        (await Event.updateLabel(auth, event, body.label)).unwrap(e => error(400, e));
    }

    return apiResponse(auth, { event });
}) satisfies RequestHandler;

export const DELETE = (async ({ params, cookies }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    if (!params.eventId) error(400, 'invalid event id');
    invalidateCache(auth.id);

    const event = (await Event.fromId(auth, params.eventId)).unwrap(e => error(404, e));
    (await Event.purge(auth, event)).unwrap(e => error(400, e));

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const GET = apiRes404;
export const POST = apiRes404;
