import { ghAPI } from '$lib/controllers/ghAPI/ghAPI.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { invalidateCache } from '$lib/utils/cache.server';
import { FileLogger } from '$lib/utils/log.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';
import { z } from 'zod';

const logger = new FileLogger('GHCB');

export const POST = (async ({ request, cookies }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth, request, {
        state: z.string(),
        code: z.string()
    });

    const accessTokenRes = await ghAPI.linkToGitHubOAuth(auth, body.code, body.state);
    if (!accessTokenRes.ok) {
        await logger.error('Failed on ghAPI.linkToGitHubOAuth', { accessToken: accessTokenRes });
        throw error(500, 'Internal server error');
    }

    return apiResponse(auth, { accessToken: accessTokenRes.val });
}) satisfies RequestHandler;

export const DELETE = (async ({ cookies }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    await ghAPI.unlinkToGitHubOAuth(auth);

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const GET = apiRes404;
export const PUT = apiRes404;
