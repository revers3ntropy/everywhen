import {
    KEY_COOKIE_KEY,
    KEY_COOKIE_OPTIONS,
    USERNAME_COOKIE_KEY,
    USERNAME_COOKIE_OPTIONS,
} from '../../lib/constants';
import type { PageServerLoad } from './$types';

export const load = (async ({ cookies }) => {
    cookies.set(KEY_COOKIE_KEY, '', KEY_COOKIE_OPTIONS);
    cookies.set(USERNAME_COOKIE_KEY, '', USERNAME_COOKIE_OPTIONS);

    // don't just throw a redirect as it does weird caching stuff,
    // leading to header bar persisting on '/',
    // even with `status: 303` (no cache)
    // throw redirect(303, '/');
    // instead allow the page to load and redirect in the browser
    return {};
}) satisfies PageServerLoad;