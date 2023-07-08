import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ url, locals, parent }) => {
    // settings & auth set by root layout
    await parent();

    const auth = locals.auth;
    const settings = locals.settings;
    if (!auth || !settings) {
        const cb = encodeURIComponent((url.pathname + url.search).slice(1));
        throw redirect(307, `/login?redirect=${cb}`);
    }

    return {
        auth,
        settings
    };
}) satisfies LayoutServerLoad;
