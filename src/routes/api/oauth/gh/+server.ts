import { ghAPI } from '$lib/controllers/ghAPI/ghAPI.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { invalidateCache } from '$lib/utils/cache.server';
import { FileLogger } from '$lib/utils/log.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

const logger = new FileLogger('GHCB');

export const POST = (async ({ request, cookies }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth, request, {
        state: 'string',
        code: 'string'
    });

    const accessToken = await ghAPI.linkToGitHubOAuth(auth, body.code, body.state);
    if (!accessToken.ok) {
        await logger.error('Failed on ghAPI.linkToGitHubOAuth', { accessToken });
        throw error(500, 'Internal server error');
    }

    return apiResponse(auth, { accessToken: accessToken.val });
}) satisfies RequestHandler;

export const DELETE = (async ({ cookies }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    await ghAPI.unlinkToGitHubOAuth(auth);

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const GET = apiRes404;
export const PUT = apiRes404;
