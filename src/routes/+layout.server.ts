import { Settings, type SettingsConfig } from '$lib/controllers/settings/settings';
import { query } from '$lib/db/mysql.server';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const prerender = false;
export const ssr = true;
export const csr = true;

export const load = (async ({ locals, parent }) => {
    await parent();

    if (locals.auth && !locals.settings) {
        const { err: settingsErr, val: settings } = await Settings.allAsMap(query, locals.auth);
        if (settingsErr) throw error(500, settingsErr);

        locals.settings = JSON.parse(
            JSON.stringify(Settings.fillWithDefaults(settings))
        ) as SettingsConfig;
    }

    return {
        __cookieWritables: locals.__cookieWritables,
        settings: locals.settings
    };
}) satisfies LayoutServerLoad;
