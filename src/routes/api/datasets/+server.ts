import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import type { RequestHandler } from './$types';
import { Dataset } from '$lib/controllers/dataset/dataset.server';
import { error } from '@sveltejs/kit';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { nowUtc } from '$lib/utils/time';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async auth => {
    const datasets = (await Dataset.Server.allMetaData(auth)).unwrap(e => error(400, e));
    return {
        datasets
    };
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
            presetId: 'string'
        },
        {
            created: nowUtc(),
            presetId: ''
        }
    );

    const { id } = (
        await Dataset.Server.create(auth, body.name, body.created, body.presetId || null)
    ).unwrap(e => error(400, e));

    return apiResponse(auth, { id });
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
