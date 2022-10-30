import { type Cookies, error } from '@sveltejs/kit';
import { KEY_COOKIE_KEY, USERNAME_COOKIE_KEY } from '../constants';
import { query } from '../db/mysql';

export async function getAuthFromCookies(
	cookie: Cookies
): Promise<{ key: string; username: string; id: string }> {
	const key = cookie.get(KEY_COOKIE_KEY);
	const username = cookie.get(USERNAME_COOKIE_KEY);

	if (!key || !username) {
		throw error(401, 'Invalid login');
	}

	const res = await query`
        SELECT * 
        FROM users 
        WHERE username = ${username}
          AND password = SHA2(CONCAT(${key}, salt), 256)
    `;
	if (res.length === 0) {
		throw error(401, 'Invalid login');
	}

	return {
		key,
		username,
		id: res[0].id
	};
}
