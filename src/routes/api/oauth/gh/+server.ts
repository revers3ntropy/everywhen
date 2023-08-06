import { ghAPI } from '$lib/controllers/ghAPI/ghAPI.server';
import { query } from '$lib/db/mysql.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { invalidateCache } from '$lib/utils/cache.server';
import { errorLogger } from '$lib/utils/log.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const POST = (async ({ request, cookies }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth, request, {
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

    return apiResponse(auth, { accessToken });
}) satisfies RequestHandler;

export const DELETE = (async ({ cookies }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    await ghAPI.unlinkToGitHubOAuth(query, auth);

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const PUT = apiRes404;
