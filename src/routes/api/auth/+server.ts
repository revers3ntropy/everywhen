import { invalidateCache } from '$lib/utils/cache.server';
import { maxAgeFromShouldRememberMe, sessionCookieOptions } from '$lib/utils/cookies';
import { GETParamIsTruthy } from '$lib/utils/GETArgs';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { COOKIE_KEYS } from '$lib/constants';
import { api404Handler, apiResponse } from '$lib/utils/apiResponse.server';
import { User } from '$lib/controllers/user/user.server';
import { Auth } from '$lib/controllers/auth/auth.server';
import { z } from 'zod';

export const GET = (async ({ url, cookies }) => {
    const key: string | null = url.searchParams.get('key');
    const username: string | null = url.searchParams.get('username');
    const rememberMe = GETParamIsTruthy(url.searchParams.get('rememberMe'));

    if (!key || !username) error(401, 'Invalid login');

    const sessionId = (
        await Auth.authenticateUserFromLogIn(username, key, maxAgeFromShouldRememberMe(rememberMe))
    ).unwrap(e => error(401, e));

    cookies.set(COOKIE_KEYS.sessionId, sessionId, sessionCookieOptions(rememberMe));

    return apiResponse(
        key,
        {
            username
        },
        {
            headers: {
                'Set-Cookie': cookies.serialize(
                    COOKIE_KEYS.sessionId,
                    sessionId,
                    sessionCookieOptions(rememberMe)
                )
            }
        }
    );
}) satisfies RequestHandler;

export const PUT = (async ({ request, cookies }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const { newPassword, currentPassword } = await getUnwrappedReqBody(auth, request, {
        currentPassword: z.string(),
        newPassword: z.string()
    });

    (await User.changePassword(auth, currentPassword, newPassword)).unwrap(e => error(400, e));

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const DELETE = (({ cookies }) => {
    const auth = Auth.tryGetAuthFromCookies(cookies);

    if (!auth) {
        cookies.delete(COOKIE_KEYS.sessionId, sessionCookieOptions(false));
        return apiResponse(null, {});
    }

    invalidateCache(auth.id);
    Auth.invalidateAllSessionsForUser(auth.id);

    cookies.delete(COOKIE_KEYS.sessionId, sessionCookieOptions(false));
    return apiResponse(null, {});
}) satisfies RequestHandler;

export const POST = api404Handler;
