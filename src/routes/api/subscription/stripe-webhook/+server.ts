import { z } from 'zod';
import { error, type RequestHandler } from '@sveltejs/kit';
import { Subscription } from '$lib/controllers/subscription/subscription.server';
import { api404Handler } from '$lib/utils/apiResponse.server';
import { FileLogger } from '$lib/utils/log.server';
import stripe from 'stripe';
import { STRIPE_WEBHOOK_SECRET } from '$env/static/private';

const stripeWebhooksLogger = new FileLogger('StripeWebHooks');

// This endpoint accepts webhook requests from Stripe API
// see https://docs.stripe.com/webhooks?locale=en-GB
// Handlers for webhooks should run asynchronously, so 'void' is used to
// disregard the returned promises.
export const POST = (async ({ request }) => {
    // validate signature
    const sig = request.headers.get('stripe-signature');
    if (!sig) error(400, 'invalid signature')
    try {
        stripe.webhooks.constructEvent(request.body?.toString() ?? '', sig, STRIPE_WEBHOOK_SECRET);
    } catch (err: unknown) {
        await stripeWebhooksLogger.log('constructing stripe event failed', { err })
        error(400, 'error');
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsedBody = z
        .object({
            type: z.string(),
            data: z.object({
                object: z.object({})
            })
        })
        .safeParse(body);
    if (!parsedBody.success) error(400, parsedBody.error.message);
    const { type, data } = parsedBody.data;
    switch (type) {
        case 'customer.subscription.created': {
            const checkedObject = z
                .object({
                    id: z.string(),
                    status: z.string(),
                    customer: z.string()
                })
                .safeParse(data.object);
            if (!checkedObject.success) error(400, checkedObject.error.message);
            void Subscription.handleCustomerSubscriptionCreated(
                checkedObject.data.id,
                checkedObject.data.status,
                checkedObject.data.customer
            );
            break;
        }
        case 'customer.subscription.updated':
            void Subscription.handleCustomerSubscriptionUpdated();
            break;
        case 'customer.subscription.deleted': {
            const checkedObject = z
                .object({
                    id: z.string(),
                    customer: z.string()
                })
                .safeParse(data.object);
            if (!checkedObject.success) error(400, checkedObject.error.message);
            void Subscription.handleCustomerSubscriptionDeleted(
                checkedObject.data.id,
                checkedObject.data.customer
            );
            break;
        }
        case 'customer.subscription.paused': {
            const checkedObject = z
                .object({
                    id: z.string(),
                    customer: z.string()
                })
                .safeParse(data.object);
            if (!checkedObject.success) error(400, checkedObject.error.message);
            void Subscription.handleCustomerSubscriptionPaused(
                checkedObject.data.id,
                checkedObject.data.customer
            );
            break;
        }
        case 'customer.subscription.resumed': {
            const checkedObject = z
                .object({
                    id: z.string(),
                    customer: z.string()
                })
                .safeParse(data.object);
            if (!checkedObject.success) error(400, checkedObject.error.message);
            void Subscription.handleCustomerSubscriptionResumed(
                checkedObject.data.id,
                checkedObject.data.customer
            );
            break;
        }
        case 'customer.deleted': {
            const checkedObject = z
                .object({
                    id: z.string(),
                    customer: z.string()
                })
                .safeParse(data.object);
            if (!checkedObject.success) error(400, checkedObject.error.message);
            void Subscription.handleCustomerSubscriptionDeleted(
                checkedObject.data.id,
                checkedObject.data.customer
            );
            break;
        }
        default:
            await stripeWebhooksLogger.error('Unhandled Stripe webhook', {
                type
            });
            error(400, 'unhandled webhook type');
    }

    console.log(type, body);

    return new Response('ok', { status: 200 });
}) satisfies RequestHandler;

export const GET = api404Handler;
export const PUT = api404Handler;
export const DELETE = api404Handler;
