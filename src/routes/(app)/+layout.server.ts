import { Auth } from '$lib/controllers/auth/auth';
import { Subscription } from '$lib/controllers/subscription/subscription.server';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ url, locals, parent }) => {
    await parent();
    const { auth, settings } = locals;

    if (!auth || !settings) {
        redirect(307, Auth.wantsToStayLoggedInAuthUrl(url.href));
    }

    return {
        settings,
        activeSubscriptionType: await Subscription.getCurrentSubscription(auth)
    };
}) satisfies LayoutServerLoad;
