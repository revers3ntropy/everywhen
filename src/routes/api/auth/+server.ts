import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import {
    AUTH_COOKIE_OPTIONS,
    KEY_COOKIE_KEY,
    USERNAME_COOKIE_KEY,
} from '../../../lib/constants';
import { User } from '../../../lib/controllers/user';
import { query } from '../../../lib/db/mysql';
import { apiResponse } from '../../../lib/utils';

export const GET = (async ({ url, cookies }) => {
    let key: string | undefined | null = url.searchParams.get('key');
    const username: string | undefined | null = url.searchParams.get('username');

    if (!key) {
        key = cookies.get(KEY_COOKIE_KEY);
    }

    if (!key || !username) {
        throw error(401, 'Invalid login');
    }

    const { err } = await User.authenticate(query, username, key);

    if (err) throw error(401, err);

    cookies.set(KEY_COOKIE_KEY, key, AUTH_COOKIE_OPTIONS);
    cookies.set(USERNAME_COOKIE_KEY, username, AUTH_COOKIE_OPTIONS);

    return apiResponse({});
}) satisfies RequestHandler;
