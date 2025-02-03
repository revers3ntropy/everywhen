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
    if (!sig) error(400, 'invalid signature');
    try {
        stripe.webhooks.constructEvent(request.body?.toString() ?? '', sig, STRIPE_WEBHOOK_SECRET);
    } catch (err: unknown) {
        await stripeWebhooksLogger.log('constructing stripe event failed', { err });
        error(400, 'error');
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsedBody = z
        .object({
            type: z.string(),
            data: z.object({
                object: z.object({
                    customer: z.string()
                })
            })
        })
        .safeParse(body);
    if (!parsedBody.success) error(400, parsedBody.error.message);
    const { data } = parsedBody.data;

    // get user id from stripe customer id
    const userId = await Subscription.userIdFromStripeCustomerId(data.object.customer);

    if (!userId) {
        await stripeWebhooksLogger.log('no user found for stripe customer id', { data });
        error(400, 'no user found');
    }

    // don't bother seeing what the webhook actually is,
    // just sync with Stripe to make sure we're up to date
    await Subscription.validateSubscriptions(userId, data.object.customer);

    return new Response('ok', { status: 200 });
}) satisfies RequestHandler;

export const GET = api404Handler;
export const PUT = api404Handler;
export const DELETE = api404Handler;
