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
import { getUnwrappedReqBody } from '../../../lib/utils';

export const POST: RequestHandler = async ({ request, cookies }) => {
    const body = await getUnwrappedReqBody(request, {
        username: 'string',
        password: 'string',
    });

    const { err } = await User.create(query, body.username, body.password);
    if (err) throw error(400, err);

    cookies.set(KEY_COOKIE_KEY, body.password, AUTH_COOKIE_OPTIONS);
    cookies.set(USERNAME_COOKIE_KEY, body.username, AUTH_COOKIE_OPTIONS);

    return new Response(JSON.stringify({}), { status: 200 });
};

export const DELETE: RequestHandler = async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const { err, val: backup } = await Backup.generate(query, auth);
    if (err) throw error(400, err);

    await User.purge(query, auth);

    cookies.delete(KEY_COOKIE_KEY, AUTH_COOKIE_OPTIONS);
    cookies.delete(USERNAME_COOKIE_KEY, AUTH_COOKIE_OPTIONS);

    return new Response(JSON.stringify({
        backup: backup.asEncryptedString(auth),
    }), { status: 200 });
};