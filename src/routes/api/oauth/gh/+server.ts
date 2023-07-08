import { User } from '$lib/controllers/user/user.server';
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

    console.log(body);

    const { val: accessToken, err } = await User.getGitHubOAuthAccessToken(body.code, body.state);
    if (err) {
        await errorLogger.error(err);
        throw error(500, 'Internal server error');
    }

    console.log(accessToken);

    return apiResponse({ accessToken });
}) satisfies RequestHandler;

export const PUT = apiRes404;
export const DELETE = apiRes404;
