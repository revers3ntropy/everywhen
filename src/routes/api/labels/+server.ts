import { error } from '@sveltejs/kit';
import { Label } from '$lib/controllers/label/label';
import { query } from '$lib/db/mysql.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async auth => {
    const { err, val: labels } = await Label.all(query, auth);
    if (err) throw error(400, err);
    return { labels };
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

    const { val: label, err } = await Label.create(query, auth, body);
    if (err) throw error(400, err);

    return apiResponse(auth, { id: label.id });
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
