import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { Dataset } from '$lib/controllers/dataset/dataset.server';
import { error } from '@sveltejs/kit';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { nowUtc } from '$lib/utils/time';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async auth => {
    return {
        datasets: (await Dataset.allMetaData(auth)).unwrap(e => error(400, e))
    };
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth, request, {
        created: z.number().default(nowUtc()),
        name: z.string(),
        presetId: z.string().nullable()
    });

    const { id } = (await Dataset.create(auth, body.name, body.created, body.presetId)).unwrap(e =>
        error(400, e)
    );

    return apiResponse(auth, { id });
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
