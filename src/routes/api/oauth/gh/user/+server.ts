import { ghAPI } from '$lib/controllers/ghAPI/ghAPI.server';
import { Settings } from '$lib/controllers/settings/settings.server';
import { apiRes404 } from '$lib/utils/apiResponse.server';
import { cachedApiRoute } from '$lib/utils/cache.server';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// TODO think about a better caching strategy for this,
// as it could change externally
export const GET = cachedApiRoute(async auth => {
    const { val: settings, err: getSettingsErr } = await Settings.Server.allAsMapWithDefaults(auth);
    if (getSettingsErr) throw error(500, getSettingsErr);

    if (!settings.gitHubAccessToken.value) {
        throw error(404, 'No GitHub account is linked');
    }

    const { val: userInfo, err } = await ghAPI.getGhUserInfo(settings.gitHubAccessToken.value);
    if (err) throw error(500, err);

    return userInfo;
}) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
export const PUT = apiRes404;
