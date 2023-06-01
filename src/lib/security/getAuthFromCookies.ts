import { type Cookies, error } from '@sveltejs/kit';
import { KEY_COOKIE_KEY, USERNAME_COOKIE_KEY } from '../constants';
import { User } from '../controllers/user';
import { query } from '../db/mysql';

export async function tryGetAuthFromCookies(
    cookie: Cookies
): Promise<User | null> {
    const key = cookie.get(KEY_COOKIE_KEY);
    const username = cookie.get(USERNAME_COOKIE_KEY);

    if (!key || !username) return null;

    const { err, val: user } = await User.authenticate(query, username, key);
    if (err) return null;
    return user;
}

export async function getAuthFromCookies(cookie: Cookies): Promise<User> {
    const user = await tryGetAuthFromCookies(cookie);
    if (!user) throw error(401, 'Invalid authentication');
    return user;
}
