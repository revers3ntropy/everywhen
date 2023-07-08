import { ghAPI } from '$lib/controllers/ghAPI/ghAPI.server';
import { apiRes404 } from '$lib/utils/apiResponse.server';
import { cachedApiRoute } from '$lib/utils/cache.server';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// TODO think about a better caching strategy for this,
// as it could change externally
export const GET = cachedApiRoute(async auth => {
    if (!auth.ghAccessToken) {
        throw error(404, JSON.stringify({ error: 'No GitHub account is linked' }));
    }

    const { val: userInfo, err } = await ghAPI.getGhUserInfo(auth);
    if (err) {
        throw error(500, JSON.stringify({ error: err }));
    }

    return userInfo;
}) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
export const PUT = apiRes404;
