import { error } from '@sveltejs/kit';
import { Settings } from '../../../lib/controllers/settings';
import { query } from '../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';
import { apiRes404, apiResponse } from '../../../lib/utils/apiResponse';
import { getUnwrappedReqBody } from '../../../lib/utils/requestBody';
import type { RequestHandler } from './$types';

export const GET = (async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const { err, val: settings } = await Settings.all(query, auth);
    if (err) throw error(400, err);

    return apiResponse({ settings });
}) satisfies RequestHandler;

export const PUT = (async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const body = await getUnwrappedReqBody(request, {
        key: 'string',
        value: 'any',
    });

    const { val: setting, err } = await Settings.update(query, auth,
        body.key, body.value);
    if (err) throw error(400, err);

    return apiResponse({ id: setting.id });
}) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;