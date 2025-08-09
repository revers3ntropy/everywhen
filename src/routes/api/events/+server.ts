import { error } from '@sveltejs/kit';
import { Event } from '$lib/controllers/event/event.server';
import { Label } from '$lib/controllers/label/label.server';
import { api404Handler, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { nowUtc } from '$lib/utils/time';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async auth => {
    return {
        events: await Event.all(auth)
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
        tzOffset: z.number(),
        labelId: z.string().nullable().default(null)
    });

    // check label exists
    if (body.labelId) {
        if (!(await Label.userHasLabelWithId(auth, body.labelId))) {
            error(400, `Label doesn't exist`);
        }
    }

    const event = (
        await Event.create(
            auth,
            body.name,
            body.start,
            body.end,
            body.tzOffset,
            body.labelId,
            body.created ?? nowUtc()
        )
    ).unwrap(e => error(400, e));

    return apiResponse(auth, { id: event.id });
}) satisfies RequestHandler;

export const DELETE = api404Handler;
export const PUT = api404Handler;
