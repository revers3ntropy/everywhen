import { Auth } from '$lib/controllers/auth/auth';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ url, locals, parent }) => {
    // settings & auth set by root layout
    await parent();

    const { auth, settings } = locals;

    if (!auth || !settings) {
        throw redirect(307, Auth.wantsToStayLoggedInAuthUrl(url.href));
    }

    return {
        settings
    };
}) satisfies LayoutServerLoad;
