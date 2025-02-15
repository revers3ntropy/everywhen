import { z } from 'zod';
import { error, type RequestHandler } from '@sveltejs/kit';
import { Subscription } from '$lib/controllers/subscription/subscription.server';
import { api404Handler } from '$lib/utils/apiResponse.server';
import { FileLogger } from '$lib/utils/log.server';

const stripeWebhooksLogger = new FileLogger('StripeWebHooks');

// This endpoint accepts webhook requests from Stripe API
// see https://docs.stripe.com/webhooks?locale=en-GB
// Handlers for webhooks should run asynchronously, so 'void' is used to
// disregard the returned promises.
// Don't bother validating the signature, we don't actually care if the webhook is legit
// or not really, it's just a cue to go to Stripe to check we are synced.
export const POST = (async ({ request }) => {
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
