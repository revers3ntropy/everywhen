import { BackupControllerServer } from '$lib/controllers/backup/backup.server';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { COOKIE_KEYS, cookieOptions, sessionCookieOptions } from '$lib/constants';
import { query } from '$lib/db/mysql.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { UserControllerServer } from '$lib/controllers/user/user.server';
import { Auth } from '$lib/controllers/auth/auth.server';

export const POST = (async ({ request, cookies }) => {
    const body = await getUnwrappedReqBody(null, request, {
        username: 'string',
        password: 'string'
    });

    const { err } = await UserControllerServer.create(query, body.username, body.password);
    if (err) throw error(400, err);

    const { err: authErr, val: sessionId } = await Auth.Server.authenticateUserFromLogIn(
        body.username,
        body.password
    );
    if (authErr) throw error(401, authErr);

    cookies.set(COOKIE_KEYS.sessionId, sessionId, sessionCookieOptions(false));

    return apiResponse(body.password, { sessionId });
}) satisfies RequestHandler;

export const DELETE = (async ({ cookies, locals: { auth } }) => {
    if (!auth) throw error(401, 'Invalid authentication');
    invalidateCache(auth.id);

    const { err, val: backup } = await BackupControllerServer.generate(query, auth);
    if (err) throw error(400, err);

    await UserControllerServer.purge(query, auth);

    cookies.delete(
        COOKIE_KEYS.sessionId,
        cookieOptions({
            httpOnly: true,
            rememberMe: false
        })
    );

    const backupEncrypted = BackupControllerServer.asEncryptedString(backup, auth.key);

    return apiResponse(auth, {
        backup: backupEncrypted
    });
}) satisfies RequestHandler;

export const GET = apiRes404;
export const PUT = apiRes404;
