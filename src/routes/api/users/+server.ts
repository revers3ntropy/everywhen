import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import {
    AUTH_COOKIE_OPTIONS,
    KEY_COOKIE_KEY,
    USERNAME_COOKIE_KEY,
} from '../../../lib/constants';
import { Backup } from '../../../lib/controllers/backup';
import { User } from '../../../lib/controllers/user';
import { query } from '../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';
import { apiResponse, getUnwrappedReqBody } from '../../../lib/utils';

export const POST = (async ({ request, cookies }) => {
    const body = await getUnwrappedReqBody(request, {
        username: 'string',
        password: 'string',
    });

    const { err } = await User.create(query, body.username, body.password);
    if (err) throw error(400, err);

    cookies.set(KEY_COOKIE_KEY, body.password, AUTH_COOKIE_OPTIONS);
    cookies.set(USERNAME_COOKIE_KEY, body.username, AUTH_COOKIE_OPTIONS);

    return apiResponse({});
}) satisfies RequestHandler;

export const DELETE = (async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const { err, val: backup } = await Backup.generate(query, auth);
    if (err) throw error(400, err);

    await User.purge(query, auth);

    cookies.delete(KEY_COOKIE_KEY, AUTH_COOKIE_OPTIONS);
    cookies.delete(USERNAME_COOKIE_KEY, AUTH_COOKIE_OPTIONS);

    return apiResponse({
        backup: backup.asEncryptedString(auth),
    });
}) satisfies RequestHandler;