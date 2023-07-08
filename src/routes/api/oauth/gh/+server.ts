import { ghAPI } from '$lib/controllers/ghAPI/ghAPI.server';
import { User } from '$lib/controllers/user/user.server';
import { query } from '$lib/db/mysql.server';
import { getAuthFromCookies } from '$lib/security/getAuthFromCookies';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { invalidateCache } from '$lib/utils/cache.server';
import { errorLogger } from '$lib/utils/log.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST = (async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(request, {
        state: 'string',
        code: 'string'
    });

    const { val: accessToken, err } = await ghAPI.linkToGitHubOAuth(
        query,
        auth,
        body.code,
        body.state
    );
    if (err) {
        await errorLogger.error(err);
        throw error(500, 'Internal server error');
    }

    return apiResponse({ accessToken });
}) satisfies RequestHandler;

export const DELETE = (async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    await User.unlinkGitHubOAuth(query, auth);

    return apiResponse({});
}) satisfies RequestHandler;

export const PUT = apiRes404;
