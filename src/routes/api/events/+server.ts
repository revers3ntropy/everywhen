import { error } from '@sveltejs/kit';
import { Event } from '$lib/controllers/event/event.server';
import { Label } from '$lib/controllers/label/label.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { nowUtc } from '$lib/utils/time';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async auth => {
    return {
        events: (await Event.all(auth)).unwrap(e => error(400, e))
    };
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth, request, {
        created: z.number().optional(),
        name: z.string(),
        start: z.number(),
        end: z.number(),
        label: z.string().nullable().default(null)
    });

    // check label exists
    if (body.label) {
        if (!(await Label.userHasLabelWithId(auth, body.label))) {
            throw error(400, `Label doesn't exist`);
        }
    }

    const event = (
        await Event.create(
            auth,
            body.name,
            body.start,
            body.end,
            body.label,
            body.created ?? nowUtc()
        )
    ).unwrap(e => error(400, e));

    return apiResponse(auth, { id: event.id });
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
