import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { cookieOptions, STORE_KEY } from '$lib/constants';
import { Backup } from '$lib/controllers/backup/backup';
import { User } from '$lib/controllers/user/user';
import { query } from '$lib/db/mysql.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';

export const POST = (async ({ request, cookies }) => {
    const body = await getUnwrappedReqBody(request, {
        username: 'string',
        password: 'string'
    });

    const { err, val } = await User.create(query, body.username, body.password);
    if (err) throw error(400, err);

    cookies.set(STORE_KEY.key, body.password, cookieOptions(false, false));
    cookies.set(STORE_KEY.username, body.username, cookieOptions(true, false));

    return apiResponse({ ...val });
}) satisfies RequestHandler;

export const DELETE = (async ({ cookies, locals: { auth } }) => {
    if (!auth) throw error(401, 'Invalid authentication');
    invalidateCache(auth.id);

    const { err, val: backup } = await Backup.generate(query, auth);
    if (err) throw error(400, err);

    await User.purge(query, auth);

    cookies.delete(STORE_KEY.key, cookieOptions(false, false));
    cookies.delete(STORE_KEY.username, cookieOptions(true, false));

    const { err: backupErr, val: backupEncrypted } = Backup.asEncryptedString(backup, auth);
    if (backupErr) throw error(400, backupErr);

    return apiResponse({
        backup: backupEncrypted
    });
}) satisfies RequestHandler;

export const GET = apiRes404;
export const PUT = apiRes404;
