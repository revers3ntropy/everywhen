import { error } from '@sveltejs/kit';
import { Settings, type SettingsKey } from '$lib/controllers/settings/settings';
import { query } from '$lib/db/mysql.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async auth => {
    const { err, val: settings } = await Settings.allAsMap(query, auth);
    if (err) throw error(500, err);
    return {
        settings: Settings.fillWithDefaults(settings)
    };
}) satisfies RequestHandler;

export const PUT = (async ({ request, cookies }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(request, {
        key: 'string',
        value: 'any'
    });

    const key = body.key;

    const possibleKeys = Object.keys(Settings.config);
    if (!possibleKeys.includes(key)) {
        throw error(400, 'Invalid key');
    }

    const { val: setting, err } = await Settings.update(
        query,
        auth,
        key as SettingsKey,
        body.value
    );
    if (err) throw error(400, err);

    return apiResponse(auth, { id: setting.id });
}) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
