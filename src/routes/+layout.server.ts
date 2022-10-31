import 'ts-polyfill';
import type { LayoutServerLoad } from './$types';
import { KEY_COOKIE_KEY, USERNAME_COOKIE_KEY } from '$lib/constants';
import { redirect } from '@sveltejs/kit';
import { query } from '$lib/db/mysql';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
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

	return null;
};
