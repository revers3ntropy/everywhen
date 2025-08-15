import { invalidateCache } from '$lib/utils/cache.server';
import { maxAgeFromShouldRememberMe, sessionCookieOptions } from '$lib/utils/cookies';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { COOKIE_KEYS } from '$lib/constants';
import { api404Handler, apiResponse } from '$lib/utils/apiResponse.server';
import { User } from '$lib/controllers/user/user.server';
import { Auth } from '$lib/controllers/auth/auth.server';
import { z } from 'zod';

export const POST = (async ({ request, cookies }) => {
    let bodyJson;
    try {
        bodyJson = await request.json();
    } catch (e) {
        error(400, 'Invalid login');
    }
    const body = z
        .object({
            key: z.string(),
            username: z.string(),
            rememberMe: z.boolean().optional().default(false)
        })
        .safeParse(bodyJson);
    if (body.error) return error(401, 'Invalid login');

    const { username, key, rememberMe } = body.data;

    const sessionId = (
        await Auth.authenticateUserFromLogIn(username, key, maxAgeFromShouldRememberMe(rememberMe))
    ).unwrap(e => error(401, e));

    cookies.set(COOKIE_KEYS.sessionId, sessionId, sessionCookieOptions(rememberMe));

    return apiResponse(key, {});
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

export const GET = api404Handler;
