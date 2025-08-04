import { error } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { ghAPI } from '$lib/controllers/ghAPI/ghAPI.server';
import { api404Handler, apiResponse } from '$lib/utils/apiResponse.server';
import { invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { Auth } from '$lib/controllers/auth/auth.server';
import { SSLogger } from '$lib/controllers/logs/logs.server';

const logger = new SSLogger('GitHubCB');

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
        error(500, 'Internal server error');
    }

    return apiResponse(auth, { accessToken: accessTokenRes.val });
}) satisfies RequestHandler;

export const DELETE = (async ({ cookies }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    await ghAPI.unlinkToGitHubOAuth(auth);

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const GET = api404Handler;
export const PUT = api404Handler;
