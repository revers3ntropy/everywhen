import { STORE_KEY } from '$lib/constants';
import { type Cookies, error } from '@sveltejs/kit';
import { User } from '../controllers/user';
import { query } from '../db/mysql';

export async function tryGetAuthFromCookies(cookie: Cookies): Promise<User | null> {
    const key = cookie.get(STORE_KEY.key);
    const username = cookie.get(STORE_KEY.username);

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
