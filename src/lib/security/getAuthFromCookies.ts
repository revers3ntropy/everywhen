import { type Cookies, error } from '@sveltejs/kit';
import { KEY_COOKIE_KEY, USERNAME_COOKIE_KEY } from '../constants';
import { User } from '../controllers/user';
import { query } from '../db/mysql';

export async function getAuthFromCookies(cookie: Cookies): Promise<User> {
    const key = cookie.get(KEY_COOKIE_KEY);
    const username = cookie.get(USERNAME_COOKIE_KEY);

    if (!key || !username) {
        throw error(401, 'Invalid login');
    }

    const { err, val: user } = await User.authenticate(query, username, key);
    if (err) throw error(401, err);
    return user;
}
