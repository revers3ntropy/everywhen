import { error } from '@sveltejs/kit';
import { Settings } from '$lib/controllers/settings/settings';
import { query } from '$lib/db/mysql';
import { getAuthFromCookies } from '$lib/security/getAuthFromCookies';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody';
import type { RequestHandler } from './$types';

export const GET = cachedApiRoute(async auth => {
    const { err, val: settings } = await Settings.all(query, auth);
    if (err) throw error(500, err);
    return { settings };
}) satisfies RequestHandler;

export const PUT = (async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(request, {
        key: 'string',
        value: 'any'
    });

    const { val: setting, err } = await Settings.update(query, auth, body.key, body.value);
    if (err) throw error(400, err);

    return apiResponse({ id: setting.id });
}) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
