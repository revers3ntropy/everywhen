import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// must be authorised to access this page (gh oauth callback)
export const load = (async ({ url, locals, parent }) => {
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
}) satisfies PageServerLoad;
