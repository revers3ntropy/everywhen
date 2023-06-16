import { error } from '@sveltejs/kit';
import { Label } from '$lib/controllers/label';
import { query } from '$lib/db/mysql';
import { getAuthFromCookies } from '$lib/security/getAuthFromCookies';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache';
import { getUnwrappedReqBody } from '$lib/utils/requestBody';
import type { RequestHandler } from './$types';

export const GET = cachedApiRoute(async auth => {
    const { err, val: labels } = await Label.all(query, auth);
    if (err) throw error(400, err);
    return { labels };
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(
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

    return apiResponse({ id: label.id });
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
