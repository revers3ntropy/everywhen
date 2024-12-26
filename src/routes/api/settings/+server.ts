import type { SettingsKey } from '$lib/controllers/settings/settings';
import { error } from '@sveltejs/kit';
import { Settings } from '$lib/controllers/settings/settings.server';
import { api404Handler, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async auth => {
    return {
        settings: (await Settings.allAsMapWithDefaults(auth)).unwrap(e => error(400, e))
    };
}) satisfies RequestHandler;

export const PUT = (async ({ request, cookies }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const { key, value } = await getUnwrappedReqBody(auth, request, {
        key: z.string(),
        value: z.unknown()
    });

    if (!(key in Settings.config)) {
        error(400, 'Invalid key');
    }

    const setting = (await Settings.update(auth, key as SettingsKey, value)).unwrap(e =>
        error(400, e)
    );

    return apiResponse(auth, { id: setting.id });
}) satisfies RequestHandler;

export const POST = api404Handler;
export const DELETE = api404Handler;
