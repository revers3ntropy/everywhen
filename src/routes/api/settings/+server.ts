import type { SettingsKey } from '$lib/controllers/settings/settings';
import { error } from '@sveltejs/kit';
import { Settings } from '$lib/controllers/settings/settings.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async auth => {
    const { err, val: settings } = await Settings.Server.allAsMap(auth);
    if (err) throw error(500, err);
    return {
        settings: Settings.fillWithDefaults(settings)
    };
}) satisfies RequestHandler;

export const PUT = (async ({ request, cookies }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth, request, {
        key: 'string',
        value: 'any'
    });

    const key = body.key;

    const possibleKeys = Object.keys(Settings.config);
    if (!possibleKeys.includes(key)) {
        throw error(400, 'Invalid key');
    }

    const { val: setting, err } = await Settings.Server.update(
        auth,
        key as SettingsKey,
        body.value
    );
    if (err) throw error(400, err);

    return apiResponse(auth, { id: setting.id });
}) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
