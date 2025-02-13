import { error } from '@sveltejs/kit';
import { Label } from '$lib/controllers/label/label.server';
import { api404Handler, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async auth => {
    return {
        labels: await Label.all(auth)
    };
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth, request, {
        name: z.string(),
        color: z.string()
    });

    const { id } = (await Label.create(auth, body)).unwrap(e => error(400, e));

    return apiResponse(auth, { id });
}) satisfies RequestHandler;

export const DELETE = api404Handler;
export const PUT = api404Handler;
