import { error, redirect } from '@sveltejs/kit';
import { Settings, type SettingsConfig } from '$lib/controllers/settings';
import type { Auth } from '$lib/controllers/user';
import { query } from '$lib/db/mysql';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad<
    Promise<{
        auth: Auth;
        settings: SettingsConfig;
    }>
> = async ({ url, locals }) => {
    const auth = locals.auth;
    if (!auth) {
        throw redirect(307, '/login?redirect=' + url.pathname.trim().slice(1));
    }

    const { err: settingsErr, val: settings } = await Settings.allAsMap(query, auth);
    if (settingsErr) throw error(500, settingsErr);

    const settingsValues = JSON.parse(
        JSON.stringify(Settings.fillWithDefaults(settings as Record<string, Settings>))
    ) as SettingsConfig;

    return {
        auth,
        settings: settingsValues
    };
};
