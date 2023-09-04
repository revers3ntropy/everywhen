import { COOKIE_KEYS } from '$lib/constants';
import { Auth } from '$lib/controllers/auth/auth';
import { sessionCookieOptions } from '$lib/utils/cookies';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ url, locals, parent, cookies }) => {
    // settings & auth set by root layout
    await parent();

    const { auth, settings } = locals;

    if (!auth || !settings) {
        cookies.delete(COOKIE_KEYS.sessionId, sessionCookieOptions(false));
        throw redirect(307, Auth.requireAuthUrl(url.href));
    }

    return {
        settings
    };
}) satisfies LayoutServerLoad;
