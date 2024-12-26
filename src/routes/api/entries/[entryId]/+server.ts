import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { api404Handler, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async (auth, { params }) => {
    if (!params.entryId) error(400, 'invalid id');

    const entry = (await Entry.getFromId(auth, params.entryId, true)).unwrap(e => error(400, e));

    return { ...entry };
}) satisfies RequestHandler;

export const DELETE = (async ({ request, params, cookies }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    if (!params.entryId) error(400, 'invalid id');
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth, request, {
        restore: z.boolean().default(false)
    });

    (await Entry.del(auth, params.entryId, body.restore)).unwrap(e => error(400, e));

    return apiResponse(auth, { id: params.entryId });
}) satisfies RequestHandler;

export const PUT = (async ({ request, params, cookies }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    if (!params.entryId) error(400, 'invalid id');
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth, request, {
        title: z.string().default(''),
        body: z.string(),
        labelId: z.string().nullable(),
        latitude: z.number().nullable().default(null),
        longitude: z.number().nullable().default(null),
        timezoneUtcOffset: z.number().default(0),
        agentData: z.string().default('')
    });

    const entry = (await Entry.getFromId(auth, params.entryId, true)).unwrap(e => error(400, e));

    await Entry.edit(
        auth,
        entry,
        body.title,
        body.body,
        body.latitude,
        body.longitude,
        body.labelId,
        body.timezoneUtcOffset,
        body.agentData
    );

    return apiResponse(auth, { id: entry.id });
}) satisfies RequestHandler;

export const POST = api404Handler;
