import type { RequestHandler } from '@sveltejs/kit';
import { KEY_COOKIE_KEY, USERNAME_COOKIE_KEY } from '$lib/constants';
import { query } from '$lib/db/mysql';

export const GET: RequestHandler = async ({ url, cookies }) => {
	let key: string | undefined | null = url.searchParams.get('key');
	const username: string | undefined | null = url.searchParams.get('username');

	if (!key) {
		key = cookies.get(KEY_COOKIE_KEY);
	}

	if (!key || !username) {
		return new Response(JSON.stringify({ error: 'Invalid login' }), { status: 401 });
	}

	const res = await query`
        SELECT * 
        FROM users 
        WHERE username = ${username}
          AND password = SHA2(CONCAT(${key}, salt), 256)
    `;
	if (res.length === 0) {
		return new Response(JSON.stringify({ error: 'Invalid login' }), { status: 401 });
	}

	cookies.set(KEY_COOKIE_KEY, key, {
		path: '/',
		maxAge: 60 * 60, // one hour, but will be refreshed on every request
		sameSite: 'strict',
		httpOnly: true
	});

	cookies.set(USERNAME_COOKIE_KEY, username, {
		path: '/',
		maxAge: 60 * 60, // one hour, but will be refreshed on every request
		sameSite: 'strict',
		httpOnly: true
	});

	return new Response('{}', {
		status: 200
	});
};
