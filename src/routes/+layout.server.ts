import { redirect } from '@sveltejs/kit';
import 'ts-polyfill';
import { KEY_COOKIE_KEY, NON_AUTH_ROUTES, USERNAME_COOKIE_KEY } from '../lib/constants';
import { Settings } from '../lib/controllers/settings';
import type { Auth } from '../lib/controllers/user';
import { User } from '../lib/controllers/user';
import { query } from '../lib/db/mysql';
import type { LayoutServerLoad } from './$types';

export const prerender = false;
export const ssr = true;

async function isAuthenticated (
    home: boolean,
    auth: Auth,
): Promise<App.PageData> {
    if (home) {
        throw redirect(307, '/home');
    }

    const { err, val: settings } = await Settings.allAsMap(query, auth);
    if (err) {
        console.error(err);
        throw err;
    }
    return {
        ...auth,
        settings: JSON.parse(JSON.stringify(
            Settings.fillWithDefaults(settings as Record<string, Settings>),
        )) as App.PageData['settings'],
    };
}

export const load = (async ({
    cookies,
    url,
}): Promise<App.PageData> => {
    const home = url.pathname.trim() === '/';
    const requireAuth = !NON_AUTH_ROUTES.includes(url.pathname);

    const key = cookies.get(KEY_COOKIE_KEY);
    const username = cookies.get(USERNAME_COOKIE_KEY);

    if (key && username) {
        const { err, val: user } = await User.authenticate(query, username, key);
        if (!err) {
            return await isAuthenticated(home, {
                key,
                username,
                id: user.id,
            });
        }
    }

    if (!home && requireAuth) {
        throw redirect(307, '/');
    }

    // on home page and not logged in
    return {
        key: '',
        username: '',
        id: '',
        settings: JSON.parse(JSON.stringify(
            Settings.fillWithDefaults({}),
        )) as App.PageData['settings'],
    };
}) satisfies LayoutServerLoad;
