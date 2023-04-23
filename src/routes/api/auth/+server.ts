import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import {
    KEY_COOKIE_KEY,
    KEY_COOKIE_OPTIONS,
    USERNAME_COOKIE_KEY,
    USERNAME_COOKIE_OPTIONS
} from '../../../lib/constants';
import { User } from '../../../lib/controllers/user';
import { query } from '../../../lib/db/mysql';
import { apiRes404, apiResponse } from '../../../lib/utils/apiResponse';

export const GET = (async ({ url, cookies }) => {
    let key: string | undefined | null = url.searchParams.get('key');
    const username: string | undefined | null =
        url.searchParams.get('username');

    if (!key) {
        key = cookies.get(KEY_COOKIE_KEY);
    }

    if (!key || !username) {
        throw error(401, 'Invalid login');
    }

    const { err, val: user } = await User.authenticate(query, username, key);

    if (err) throw error(401, err);

    cookies.set(KEY_COOKIE_KEY, key, KEY_COOKIE_OPTIONS);
    cookies.set(USERNAME_COOKIE_KEY, username, USERNAME_COOKIE_OPTIONS);

    return apiResponse({
        key,
        username,
        id: user.id
    });
}) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
export const PUT = apiRes404;
