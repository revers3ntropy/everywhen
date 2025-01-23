import type { Auth } from '$lib/controllers/auth/auth';
import { query } from '$lib/db/mysql.server';
import { Result } from '$lib/utils/result';
import { Stripe } from 'stripe';
import { STRIPE_SECRET_KEY, ROOT_URL } from '$env/static/private';
import { SubscriptionType } from '$lib/controllers/subscription/subscription';
import { nowUtc } from '$lib/utils/time';

export {
    SubscriptionType,
    type SubscriptionInfo
} from '$lib/controllers/subscription/subscription';

// handlers for integration with Stripe Payments
export namespace Subscription {
    const stripe = new Stripe(STRIPE_SECRET_KEY);

    const activeCheckouts = [] as {
        userId: string;
        stripeCustomerId: string;
        stripeSubscriptionId: string;
    }[];

    /**
     * @param lookupKey - Stripe price lookup key
     * @returns url to redirect users to from Stripe API
     */
    export async function createCheckoutSessionUrl(lookupKey: string): Promise<string | null> {
        const prices = await stripe.prices.list({
            lookup_keys: [lookupKey],
            expand: ['data.product']
        });
        if (prices.data.length !== 1) throw 'Invalid lookup key';
        const session = await stripe.checkout.sessions.create({
            billing_address_collection: 'auto',
            line_items: [
                {
                    price: prices.data[0].id,
                    // For metered billing, do not pass quantity
                    quantity: 1
                }
            ],
            mode: 'subscription',
            success_url: `${ROOT_URL}/subscription/cb?success=true&sessionId={CHECKOUT_SESSION_ID}`,
            cancel_url: `${ROOT_URL}/subscription/buy?cancelled=true`
        });

        return session.url;
    }

    export async function checkoutComplete(auth: Auth, sessionId: string): Promise<Result<void>> {
        const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
        if (typeof checkoutSession.customer !== 'string')
            return Result.err('invalid Stripe session');

        const userId = auth.id;
        const stripeCustomerId = checkoutSession.customer;
        const stripeSubscriptionId = checkoutSession.subscription;

        if (typeof stripeSubscriptionId !== 'string' || !stripeSubscriptionId)
            return Result.err('no subscription found');

        activeCheckouts.push({ userId, stripeCustomerId, stripeSubscriptionId });

        return Result.ok();
    }

    /**
     * @returns url to Stripe portal
     */
    export async function createPortalSessionUrl(sessionId: string): Promise<string> {
        const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
        if (typeof checkoutSession.customer !== 'string') throw 'invalid Stripe session';

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: checkoutSession.customer,
            return_url: `${ROOT_URL}/subscription/manage`
        });

        return portalSession.url;
    }

    export async function handleCustomerSubscriptionCreated(
        subscriptionId: string,
        status: string,
        customer: string
    ) {
        const checkout = activeCheckouts.find(c => c.stripeCustomerId === customer);
        if (!checkout || checkout.stripeSubscriptionId !== subscriptionId) return;
        await query`
            INSERT INTO subscriptions
                (userId, stripeCustomerId, stripeSubscriptionId, subType, active)
            VALUES (
                ${checkout.userId},
                ${checkout.stripeCustomerId},
                ${checkout.stripeSubscriptionId},
                ${SubscriptionType.Plus},
                ${status === 'active' ? nowUtc() : null}
            )
        `;
    }
    export async function handleCustomerSubscriptionDeleted() {}
    export async function handleCustomerSubscriptionUpdated() {}
    export async function handleCustomerDeleted() {}
    export async function handleCustomerSubscriptionPaused() {}
    export async function handleCustomerSubscriptionResumed() {}
}
