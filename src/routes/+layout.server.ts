import 'ts-polyfill';
import type { LayoutServerLoad } from './$types';
import { KEY_COOKIE_KEY } from '../lib/constants';
import { sha256 } from 'js-sha256';
import { KEY_HASH } from '$env/static/private';
import { redirect } from '@sveltejs/kit';

export const prerender = true;

export const load: LayoutServerLoad = async ({ cookies, url }) => {
	const key = cookies.get(KEY_COOKIE_KEY);
	const home = url.pathname.trim() === '/';

	if (!key || sha256(key) !== KEY_HASH) {
		if (!home) {
			throw redirect(307, '/');
		}
		return { key: '' };
	}

	if (home) {
		throw redirect(307, '/home');
	}

	return { key };
};
