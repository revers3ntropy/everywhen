import { Backup } from '$lib/controllers/backup/backup.server';
import { maxAgeFromShouldRememberMe, sessionCookieOptions } from '$lib/utils/cookies';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { COOKIE_KEYS } from '$lib/constants';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { User } from '$lib/controllers/user/user.server';
import { Auth } from '$lib/controllers/auth/auth.server';

export const POST = (async ({ request, cookies, locals: { auth } }) => {
    if (auth?.key) throw error(401, 'Invalid authentication');

    const body = await getUnwrappedReqBody(null, request, {
        username: 'string',
        encryptionKey: 'string'
    });

    (await User.Server.create(body.username, body.encryptionKey)).unwrap(e => error(400, e));

    const sessionId = (
        await Auth.Server.authenticateUserFromLogIn(
            body.username,
            body.encryptionKey,
            maxAgeFromShouldRememberMe(false)
        )
    ).unwrap(e => error(401, e));

    cookies.set(COOKIE_KEYS.sessionId, sessionId, sessionCookieOptions(false));

    return apiResponse(body.encryptionKey, { sessionId });
}) satisfies RequestHandler;

export const DELETE = (async ({ cookies, request, locals: { auth } }) => {
    if (!auth) throw error(401, 'Invalid authentication');
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth.key, request, {
        username: 'string',
        encryptionKey: 'string'
    });

    const userIdFromLogIn = (
        await Auth.Server.userIdFromLogIn(body.username, body.encryptionKey)
    ).unwrap(e => error(401, e));
    if (userIdFromLogIn !== auth.id) throw error(401, 'Invalid authentication');

    const backup = (await Backup.Server.generate(auth)).unwrap(e => error(400, e));

    await User.Server.purge(auth);

    cookies.delete(COOKIE_KEYS.sessionId, sessionCookieOptions(false));

    return apiResponse(null, {
        backup: JSON.stringify(backup)
    });
}) satisfies RequestHandler;

export const GET = apiRes404;
export const PUT = apiRes404;
