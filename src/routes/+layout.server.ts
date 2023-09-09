import { Settings } from '$lib/controllers/settings/settings.server';
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const prerender = false;
export const ssr = true;
export const csr = true;

export const load = (async ({ locals, parent }) => {
    await parent();

    if (locals.auth && !locals.settings) {
        locals.settings = (await Settings.allAsMapWithDefaults(locals.auth)).unwrap(e =>
            error(500, e)
        );
    }

    return {
        __cookieWritables: locals.__cookieWritables,
        settings: locals.settings
    };
}) satisfies LayoutServerLoad;
