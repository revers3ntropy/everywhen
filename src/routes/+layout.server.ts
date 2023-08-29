import { Settings } from '$lib/controllers/settings/settings.server';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const prerender = false;
export const ssr = true;
export const csr = true;

export const load = (async ({ locals, parent }) => {
    await parent();

    if (locals.auth && !locals.settings) {
        const { err: settingsErr, val: settings } = await Settings.Server.allAsMap(locals.auth);
        if (settingsErr) throw error(500, settingsErr);
        locals.settings = Settings.fillWithDefaults(settings);
    }

    return {
        __cookieWritables: locals.__cookieWritables,
        settings: locals.settings
    };
}) satisfies LayoutServerLoad;
