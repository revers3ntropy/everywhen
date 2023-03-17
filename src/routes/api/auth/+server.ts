import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import {
    AUTH_COOKIE_OPTIONS,
    KEY_COOKIE_KEY,
    USERNAME_COOKIE_KEY,
} from '../../../lib/constants';
import { User } from '../../../lib/controllers/user';
import { query } from '../../../lib/db/mysql';
import { apiResponse } from '../../../lib/utils/apiResponse';

export const GET = (async ({ url, cookies }) => {
    let key: string | undefined | null = url.searchParams.get('key');
    const username: string | undefined | null = url.searchParams.get('username');

    if (!key) {
        key = cookies.get(KEY_COOKIE_KEY);
    }

    if (!key || !username) {
        throw error(401, 'Invalid login');
    }

    const { err, val: user } = await User.authenticate(query, username, key);

    if (err) throw error(401, err);

    cookies.set(KEY_COOKIE_KEY, key, AUTH_COOKIE_OPTIONS);
    // allow the username cookie to be read by the client
    // so that it can check the auth is still valid
    // but keep the key cookie httpOnly, to prevent XSS
    // https://owasp.org/www-community/HttpOnly
    cookies.set(USERNAME_COOKIE_KEY, username, {
        ...AUTH_COOKIE_OPTIONS,
        httpOnly: false,
    });

    return apiResponse({
        key, username, id: user.id,
    });
}) satisfies RequestHandler;
