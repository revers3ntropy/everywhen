import type { HttpMethod } from '@sveltejs/kit/types/private';
import { serialize } from 'cookie';
import { KEY_COOKIE_KEY, USERNAME_COOKIE_KEY } from "../constants";
import { browser } from '$app/environment';
import { PUBLIC_SVELTEKIT_PORT } from '$env/static/public';
import type { Auth } from "../types";

export async function makeApiReq(
	auth: Auth,
	method: HttpMethod,
	path: string,
	body: any = null
) {
	let url = `/api${path}`;
	if (!browser) {
		url = `http://localhost:${PUBLIC_SVELTEKIT_PORT}${url}`;
	}

	const init: RequestInit = {
		method,
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			Cookie: serialize(KEY_COOKIE_KEY, auth.key, {
				path: '/',
				maxAge: 60,
				sameSite: 'strict',
				httpOnly: true
			}) + ' ; ' + serialize(USERNAME_COOKIE_KEY, auth.username, {
				path: '/',
				maxAge: 60,
				sameSite: 'strict',
				httpOnly: true
			})
		}
	};
	if (body) {
		init.body = JSON.stringify(body);
	}

	console.log(url, init);
	const response = await fetch(url, init);

	if (response.ok) {
		return await response.json();
	} else {
		console.error(
			`Error on api fetch (${browser ? 'client' : 'server'} side)`,
			method,
			url,
			'Gave erroneous response:',
			response
		);

		let body = await response.text();
		try {
			body = JSON.parse(body);
		} catch (e) {}

		return {
			erroneous: true,
			...response,
			body
		};
	}
}

export const api = {
	get: async (auth: Auth, path: string) =>
		await makeApiReq(auth, 'GET', path),
	post: async (auth: Auth, path: string, body: any = {}) =>
		await makeApiReq(auth, 'POST', path, body),
	put: async (auth: Auth, path: string, body: any = {}) =>
		await makeApiReq(auth, 'PUT', path, body),
	delete: async (auth: Auth, path: string, body: any = {}) =>
		await makeApiReq(auth, 'DELETE', path, body)
};
