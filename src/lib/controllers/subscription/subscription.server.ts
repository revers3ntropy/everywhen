import type { Auth } from '$lib/controllers/auth/auth';
import { query } from '$lib/db/mysql.server';
import { invalidateCache } from '$lib/utils/cache.server';
import { Stripe } from 'stripe';
import { ROOT_URL, STRIPE_SECRET_KEY } from '$env/static/private';
import { type Pricing, SubscriptionType } from '$lib/controllers/subscription/subscription';
import { isProd } from '$lib/utils/env';

export {
    SubscriptionType,
    type SubscriptionInfo
} from '$lib/controllers/subscription/subscription';

// handlers for integration with Stripe Payments
export namespace Subscription {
    const stripe = new Stripe(STRIPE_SECRET_KEY);

    // as the pricing changes very rarely, cache as aggressively as possible
    let priceCache: Pricing[] | null = null;

    export async function shouldGetPlusWithoutSubscription(userId: string) {
        if (!isProd()) return false;
        const [{ created }] = await query<{ created: number }[]>`
            SELECT created
            FROM users
            WHERE id = ${userId}
        `;
        // TODO update when 1.0 is released
        return created < 1754256651;
    }

    export async function getCurrentSubscription(auth: Auth): Promise<SubscriptionType> {
        if (await shouldGetPlusWithoutSubscription(auth.id)) {
            return SubscriptionType.Plus;
        }
        const subs = await query<{ subType: SubscriptionType }[]>`
            SELECT subType
            FROM subscriptions
            WHERE userId = ${auth.id}
        `;
        if (subs.length === 0) return SubscriptionType.Free;
        if (subs.length > 1) throw 'Multiple subscriptions';
        return subs[0].subType;
    }

    export async function getPriceList(): Promise<Pricing[]> {
        if (priceCache) return priceCache;
        const prices = await stripe.prices.list();

        const filteredprices = prices.data
            .filter(
                (
                    a
                ): a is Stripe.Price & {
                    unit_amount: number;
                    nickname: string;
                    lookup_key: string;
                } =>
                    typeof a.unit_amount === 'number' &&
                    typeof a.nickname === 'string' &&
                    typeof a.lookup_key === 'string'
            )
            .map(a => ({ price: a.unit_amount, name: a.nickname, lookupKey: a.lookup_key }));

        priceCache = filteredprices;
        return filteredprices;
    }

    async function stripeCustomerId(userId: string): Promise<string | null> {
        const subs = await query<{ stripeCustomerId: string }[]>`
            SELECT stripeCustomerId
            FROM users
            WHERE id = ${userId}
        `;
        if (subs.length === 0) return null;
        return subs[0].stripeCustomerId;
    }

    export async function userIdFromStripeCustomerId(customerId: string): Promise<string | null> {
        const subs = await query<{ id: string }[]>`
            SELECT id
            FROM users
            WHERE stripeCustomerId = ${customerId}
        `;
        if (subs.length === 0) return null;
        return subs[0].id;
    }

    /**
     * Looks in database for Stripe customer Id for a user,
     * if not found will create a Stripe user and store in DB
     * @returns {string} - Stripe customer Id
     */
    export async function ensureValidStripeCustomerId(userId: string): Promise<string> {
        const customerId = await stripeCustomerId(userId);
        if (customerId !== null) return customerId;
        const customer = await stripe.customers.create({
            metadata: { userId }
        });
        await query`
            UPDATE users
            SET stripeCustomerId = ${customer.id}
            WHERE id = ${userId}
        `;
        return customer.id;
    }

    /**
     * @returns url to redirect users to from Stripe API
     */
    export async function createCheckoutSessionUrl(
        userId: string,
        lookupKey: string
    ): Promise<string | null> {
        const prices = await stripe.prices.list({
            lookup_keys: [lookupKey],
            expand: ['data.product']
        });
        if (prices.data.length !== 1) throw 'Invalid lookup key';
        const session = await stripe.checkout.sessions.create({
            customer: await ensureValidStripeCustomerId(userId),
            billing_address_collection: 'auto',
            line_items: [
                {
                    price: prices.data[0].id,
                    // For metered billing, do not pass quantity
                    quantity: 1
                }
            ],
            mode: 'subscription',
            success_url: `${ROOT_URL}/subscription/cb?success=true`,
            cancel_url: `${ROOT_URL}/subscription/manage?cancelled=true`
        });

        return session.url;
    }

    export async function createPortalSessionUrl(auth: Auth): Promise<string | null> {
        const id = await stripeCustomerId(auth.id);
        if (!id) return null;
        return createPortalSessionUrlFromStripeCustomerId(id);
    }

    export async function createPortalSessionUrlFromStripeCustomerId(
        stripeCustomerId: string
    ): Promise<string> {
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${ROOT_URL}/subscription/manage`
        });
        return portalSession.url;
    }

    /**
     * Syncs database with Stripe.
     * Validates existing subscription for user with Stripe API.
     * Checks that the user does not have a valid subscription,
     * if none found in DB
     */
    export async function validateSubscriptions(userId: string, stripeCustomerId: string) {
        const subs = await query<{ stripeSubscriptionId: string; stripeCustomerId: string }[]>`
            SELECT stripeSubscriptionId, stripeCustomerId
            FROM subscriptions
            WHERE userId = ${userId} AND stripeCustomerId = ${stripeCustomerId}
        `;
        if (subs.length === 0) {
            // check for subscription with Stripe that is not in the database
            const subscriptions = await stripe.subscriptions.list({
                customer: stripeCustomerId,
                limit: 1,
                status: 'all'
            });

            if (subscriptions.data.length === 0) {
                // no subscription in Stripe or DB, nothing to do
                return;
            }

            const [sub] = subscriptions.data;

            if (sub.status !== 'active') {
                // subscription is not active, nothing to do
                return;
            }

            invalidateCache(userId);
            // we have a subscription in Stripe that is not in the database
            await query`
                INSERT INTO subscriptions
                    (userId, stripeCustomerId, stripeSubscriptionId, subType)
                VALUES (
                    ${userId},
                    ${stripeCustomerId},
                    ${subscriptions.data[0].id},
                    ${SubscriptionType.Plus}
                )
            `;
            return;
        }
        if (subs.length > 1) {
            // only allow one subscription at a time, simply delete
            // all bus the first
            const firstSubId = subs[0].stripeSubscriptionId;
            invalidateCache(userId);
            await query`
                DELETE FROM subscriptions
                WHERE userId = ${userId}
                    AND stripeSubscriptionId != ${firstSubId}
            `;
        }
        const sub = subs[0].stripeSubscriptionId;
        let stripeSub;
        try {
            stripeSub = await stripe.subscriptions.retrieve(sub);
        } catch (e: unknown) {
            if (
                typeof e === 'object' &&
                e &&
                'raw' in e &&
                typeof e.raw === 'object' &&
                e.raw &&
                'message' in e.raw
            ) {
                // if we get an error that there is not such subscription,
                // our DB is not in sync with Stripe and we should clear
                // subscriptions

                const message = e.raw.message as string;
                if (message.startsWith('No such subscription')) {
                    invalidateCache(userId);
                    await query`
                        DELETE FROM subscriptions
                        WHERE userId = ${userId}
                    `;
                    return;
                }
            }
            return;
        }
        if (stripeSub.customer !== subs[0].stripeCustomerId || stripeSub.status !== 'active') {
            invalidateCache(userId);
            await query`
                DELETE FROM subscriptions
                WHERE userId = ${userId}
            `;
            return;
        }
    }
}
