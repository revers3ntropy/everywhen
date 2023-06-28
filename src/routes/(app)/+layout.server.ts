import { error, type Redirect, redirect } from '@sveltejs/kit';
import {
    KEY_COOKIE_KEY,
    NO_SIGNED_IN_ROUTES,
    USERNAME_COOKIE_KEY
} from '$lib/constants';
import { Settings, type SettingsConfig } from '$lib/controllers/settings';
import type { Auth } from '$lib/controllers/user';
import { User } from '$lib/controllers/user';
import { query } from '$lib/db/mysql';
import type { LayoutServerLoad } from './$types';

// leave as `: LayoutServerLoad` for type checking
export const load: LayoutServerLoad = async ({
    cookies,
    url
}): Promise<
    Auth & {
        settings: SettingsConfig;
        path: string;
    }
> => {
    const key = cookies.get(KEY_COOKIE_KEY);
    const username = cookies.get(USERNAME_COOKIE_KEY);

    const requireAuth = (): Redirect => {
        return redirect(307, '/?redirect=' + url.pathname.trim().slice(1));
    };

    if (!key || !username) throw requireAuth();

    const { err, val: user } = await User.authenticate(query, username, key);
    if (err) throw requireAuth();

    if (NO_SIGNED_IN_ROUTES.includes(url.pathname.trim())) {
        throw redirect(307, '/home');
    }

    const auth: Auth = {
        id: user.id,
        key,
        username
    };

    const { err: settingsErr, val: settings } = await Settings.allAsMap(
        query,
        auth
    );
    if (settingsErr) throw error(500, settingsErr);

    const settingsValues = JSON.parse(
        JSON.stringify(
            Settings.fillWithDefaults(settings as Record<string, Settings>)
        )
    ) as SettingsConfig;

    return {
        ...auth,
        settings: settingsValues,
        path: url.pathname
    };
};
