import { error } from '@sveltejs/kit';
import { Event } from '$lib/controllers/event/event.server';
import { Label } from '$lib/controllers/label/label.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { nowUtc } from '$lib/utils/time';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async auth => {
    const { err, val: events } = await Event.Server.all(auth);
    if (err) throw error(400, err);
    return { events };
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(
        auth,
        request,
        {
            created: 'number',
            name: 'string',
            start: 'number',
            end: 'number',
            label: 'string'
        },
        {
            created: nowUtc(),
            label: ''
        }
    );

    // check label exists
    if (body.label) {
        if (!(await Label.Server.userHasLabelWithId(auth, body.label))) {
            throw error(400, `Label doesn't exist`);
        }
    }

    const { val: event, err } = await Event.Server.create(
        auth,
        body.name,
        body.start,
        body.end,
        body.label,
        body.created
    );
    if (err) throw error(400, err);

    return apiResponse(auth, { id: event.id });
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
