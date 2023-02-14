import "ts-polyfill";
import type { LayoutServerLoad } from "./$types";
import { KEY_COOKIE_KEY, USERNAME_COOKIE_KEY } from "$lib/constants";
import { redirect } from "@sveltejs/kit";
import { query } from "$lib/db/mysql";

export const ssr = void 0;
export const prerender = void 0;

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	console.log(`Layout: ${ url.pathname.trim() }`);
	const home = url.pathname.trim() === "/";

	const key = cookies.get(KEY_COOKIE_KEY);
	const username = cookies.get(USERNAME_COOKIE_KEY);

	await query`SELECT 1`;

	console.log(key, username);
	if (key && username) {
		const res = await query`
			SELECT id
			FROM users
			WHERE username = ${ username }
			  AND password = SHA2(CONCAT(${ key }, salt), 256)
		`;
		if (res.length !== 0) {
			if (home) {
				console.log(`User '${ username }' is logged in, Redirecting to /home`);
				throw redirect(307, "/home");
			}
			console.log(`Logged in ${ JSON.stringify({
				key, username, id: res[0].id
			}) }`);
			return { key, username, id: res[0].id };
		}
	}

	if (!home) {
		console.log(`User '${ username }' failed to authenticate`);
		throw redirect(307, '/');
	}

	// on home page and not logged in
	return null;
};
