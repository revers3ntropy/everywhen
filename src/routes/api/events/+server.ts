import { error } from '@sveltejs/kit';
import { Event } from '$lib/controllers/event/event';
import { Label } from '$lib/controllers/label/label';
import { query } from '$lib/db/mysql';
import { getAuthFromCookies } from '$lib/security/getAuthFromCookies';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache';
import { getUnwrappedReqBody } from '$lib/utils/requestBody';
import { nowUtc } from '$lib/utils/time';
import type { RequestHandler } from './$types';

export const GET = cachedApiRoute(async auth => {
    const { err, val: events } = await Event.all(query, auth);
    if (err) throw error(400, err);
    return { events };
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(
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
        if (!(await Label.userHasLabelWithId(query, auth, body.label))) {
            throw error(400, `Label doesn't exist`);
        }
    }

    const { val: event, err } = await Event.create(
        query,
        auth,
        body.name,
        body.start,
        body.end,
        body.label,
        body.created
    );
    if (err) throw error(400, err);

    return apiResponse({ id: event.id });
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
