import { redirect } from '@sveltejs/kit';
import 'ts-polyfill';
import { KEY_COOKIE_KEY, USERNAME_COOKIE_KEY } from '../lib/constants';
import { Settings, type SettingsConfig } from '../lib/controllers/settings';
import type { Auth } from '../lib/controllers/user';
import { User } from '../lib/controllers/user';
import { query } from '../lib/db/mysql';
import type { LayoutServerLoad } from './$types';

export const prerender = false;

export const load: LayoutServerLoad = async ({
    cookies,
    url,
}): Promise<App.PageData> => {
    const home = url.pathname.trim() === '/';

    const key = cookies.get(KEY_COOKIE_KEY);
    const username = cookies.get(USERNAME_COOKIE_KEY);

    if (key && username) {
        const { err, val: { id } } = await User.authenticate(query, username, key);
        if (!err) {
            if (home) {
                throw redirect(307, '/home');
            }

            const auth = { key, username, id } satisfies Auth;

            const { err, val: settings } = await Settings.allAsMap(query, auth);
            if (err) {
                throw err;
            }
            return {
                ...auth,
                settings: JSON.parse(JSON.stringify(
                    Settings.fillWithDefaults(settings),
                )) as App.PageData['settings'],
            };
        }
    }

    if (!home) {
        throw redirect(307, '/');
    }

    // on home page and not logged in
    return {
        key: '',
        username: '',
        id: '',
        settings: {} as SettingsConfig,
    };
};
