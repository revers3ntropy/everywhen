import { error } from '@sveltejs/kit';
import { Label } from '$lib/controllers/label/label.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async auth => {
    return {
        labels: (await Label.Server.all(auth)).unwrap(e => error(400, e))
    };
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(
        auth,
        request,
        {
            name: 'string',
            color: 'string'
        },
        {
            color: 'black'
        }
    );

    const { id } = (await Label.Server.create(auth, body)).unwrap(e => error(400, e));

    return apiResponse(auth, { id });
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
