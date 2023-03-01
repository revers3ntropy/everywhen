import { redirect } from '@sveltejs/kit';
import 'ts-polyfill';
import { KEY_COOKIE_KEY, USERNAME_COOKIE_KEY } from '../lib/constants';
import type { User } from '../lib/controllers/user';
import { query } from '../lib/db/mysql';
import type { LayoutServerLoad } from './$types';

export const prerender = false;

export const load: LayoutServerLoad = async ({ cookies, url }): Promise<User> => {
    const home = url.pathname.trim() === '/';

    const key = cookies.get(KEY_COOKIE_KEY);
    const username = cookies.get(USERNAME_COOKIE_KEY);

    if (key && username) {
        const res = await query`
            SELECT id
            FROM users
            WHERE username = ${username}
              AND password = SHA2(CONCAT(${key}, salt), 256)
        `;
        if (res.length !== 0) {
            if (home) {
                throw redirect(307, '/home');
            }
            return { key, username, id: res[0].id };
        }
    }

    if (!home) {
        throw redirect(307, '/');
    }

    // on home page and not logged in
    return {
        key: '',
        username: '',
        id: '',
    };
};
