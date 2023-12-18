import { maxAgeFromShouldRememberMe, sessionCookieOptions } from '$lib/utils/cookies';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { COOKIE_KEYS } from '$lib/constants';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { User } from '$lib/controllers/user/user.server';
import { Auth } from '$lib/controllers/auth/auth.server';
import { z } from 'zod';

export const POST = (async ({ request, cookies, locals: { auth } }) => {
    if (auth?.key) error(401, 'Invalid authentication');

    const body = await getUnwrappedReqBody(null, request, {
        username: z.string(),
        encryptionKey: z.string()
    });

    (await User.create(body.username, body.encryptionKey)).unwrap(e => error(400, e));

    const sessionId = (
        await Auth.authenticateUserFromLogIn(
            body.username,
            body.encryptionKey,
            maxAgeFromShouldRememberMe(false)
        )
    ).unwrap(e => error(401, e));

    cookies.set(COOKIE_KEYS.sessionId, sessionId, sessionCookieOptions(false));

    return apiResponse(body.encryptionKey, { sessionId });
}) satisfies RequestHandler;

export const DELETE = (async ({ cookies, request, locals: { auth } }) => {
    if (!auth) error(401, 'Invalid authentication');
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth.key, request, {
        username: z.string(),
        encryptionKey: z.string()
    });

    const userIdFromLogIn = (await Auth.userIdFromLogIn(body.username, body.encryptionKey)).unwrap(
        e => error(401, e)
    );
    if (userIdFromLogIn !== auth.id) error(401, 'Invalid authentication');

    await User.purge(auth);

    cookies.delete(COOKIE_KEYS.sessionId, sessionCookieOptions(false));

    return apiResponse(null, {});
}) satisfies RequestHandler;

export const GET = apiRes404;
export const PUT = apiRes404;
