import { Subscription } from '$lib/controllers/subscription/subscription.server';
import { GETParamIsTruthy } from '$lib/utils/GETArgs';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// This page is where the user is redirected to after completing OR canceling a Stripe
// checkout session, i.e. they have been redirected to stripe.com and are now finished.
// If they have completed their subscription
// In order to link an Everywhen userId with a Stripe customerId and subscriptionId,
// we need to store them all locally (just in memory)
// so that when the Strip webhook comes for 'customer.subscription.created',
// we know the userId and can make the row in the Everywhen subscriptions table
export const load = (async ({ locals, url }) => {
    if (!locals.auth) error(401, 'Unauthorized');
    // the checkout was cancelled, don't try to complete it
    if (!GETParamIsTruthy(url.searchParams.get('success'))) {
        return;
    }
    const sessionId = url.searchParams.get('sessionId');
    if (!sessionId) error(400, 'sessionId is required');
    // the Stripe checkout sessionId can be used to retrieve the subscriptionId
    // and customerId
    await Subscription.checkoutComplete(locals.auth, sessionId);
}) as PageServerLoad;
