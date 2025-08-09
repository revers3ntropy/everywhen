import { Auth } from '$lib/controllers/auth/auth';
import { Label } from '$lib/controllers/label/label.server';
import { Location } from '$lib/controllers/location/location.server';
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
        activeSubscriptionType: await Subscription.getCurrentSubscription(auth),
        labels: await Label.allIndexedById(auth),
        locations: await Location.all(auth)
    };
}) satisfies LayoutServerLoad;
