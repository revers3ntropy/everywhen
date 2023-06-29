import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import {
    KEY_COOKIE_KEY,
    KEY_COOKIE_OPTIONS,
    USERNAME_COOKIE_KEY,
    USERNAME_COOKIE_OPTIONS
} from '$lib/constants';
import { Backup } from '$lib/controllers/backup';
import { User } from '$lib/controllers/user';
import { query } from '$lib/db/mysql';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse';
import { invalidateCache } from '$lib/utils/cache';
import { getUnwrappedReqBody } from '$lib/utils/requestBody';

export const POST = (async ({ request, cookies }) => {
    const body = await getUnwrappedReqBody(request, {
        username: 'string',
        password: 'string'
    });

    const { err, val } = await User.create(query, body.username, body.password);
    if (err) throw error(400, err);

    cookies.set(KEY_COOKIE_KEY, body.password, KEY_COOKIE_OPTIONS);
    cookies.set(USERNAME_COOKIE_KEY, body.username, USERNAME_COOKIE_OPTIONS);

    return apiResponse({ ...val });
}) satisfies RequestHandler;

export const DELETE = (async ({ cookies, locals: { auth } }) => {
    if (!auth) throw error(401, 'Invalid authentication');
    invalidateCache(auth.id);

    const { err, val: backup } = await Backup.generate(query, auth);
    if (err) throw error(400, err);

    await User.purge(query, auth);

    cookies.delete(KEY_COOKIE_KEY, KEY_COOKIE_OPTIONS);
    cookies.delete(USERNAME_COOKIE_KEY, USERNAME_COOKIE_OPTIONS);

    const { err: backupErr, val: backupEncrypted } = Backup.asEncryptedString(backup, auth);
    if (backupErr) throw error(400, backupErr);

    return apiResponse({
        backup: backupEncrypted
    });
}) satisfies RequestHandler;

export const GET = apiRes404;
export const PUT = apiRes404;
