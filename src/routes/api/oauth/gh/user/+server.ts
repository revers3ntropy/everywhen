import { ghAPI } from '$lib/controllers/ghAPI/ghAPI.server';
import { Settings } from '$lib/controllers/settings/settings.server';
import { apiRes404 } from '$lib/utils/apiResponse.server';
import { cachedApiRoute } from '$lib/utils/cache.server';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// TODO think about a better caching strategy for this,
// as it could change externally
export const GET = cachedApiRoute(async auth => {
    const settings = (await Settings.allAsMapWithDefaults(auth)).unwrap(e => error(500, e));
    if (!settings.gitHubAccessToken.value) error(404, 'No GitHub account is linked');
    return (await ghAPI.getGhUserInfo(settings.gitHubAccessToken.value)).unwrap(e => error(500, e));
}) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
export const PUT = apiRes404;
