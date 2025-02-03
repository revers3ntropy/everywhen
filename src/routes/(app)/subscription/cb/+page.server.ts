import { Subscription } from '$lib/controllers/subscription/subscription.server';
import { GETParamIsTruthy } from '$lib/utils/GETArgs';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// This page is where the user is redirected to after completing a Stripe
// checkout session, i.e. they have been redirected to stripe.com and are now finished.
export const load = (async ({ locals, url }) => {
    if (!locals.auth) error(401, 'Unauthorized');
    // the checkout went wrong, don't try to complete it
    if (!GETParamIsTruthy(url.searchParams.get('success')))
        error(400, 'Failed to complete checkout');
    // simply update the database based on Stripe's response

    await Subscription.validateSubscriptions(
        locals.auth.id,
        await Subscription.ensureValidStripeCustomerId(locals.auth.id)
    );

    redirect(301, '/subscription/manage');
}) as PageServerLoad;
