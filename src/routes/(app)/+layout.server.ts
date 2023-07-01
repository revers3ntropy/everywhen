import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ url, locals, parent }) => {
    // settings is set by root layout
    await parent();

    const auth = locals.auth;
    const settings = locals.settings;
    if (!auth || !settings) {
        throw redirect(307, '/login?redirect=' + url.pathname.trim().slice(1));
    }

    return {
        auth,
        settings
    };
}) satisfies LayoutServerLoad;
