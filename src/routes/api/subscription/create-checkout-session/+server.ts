import { error, type RequestHandler } from '@sveltejs/kit';
import { Subscription } from '$lib/controllers/subscription/subscription.server';
import { api404Handler, apiResponse } from '$lib/utils/apiResponse.server';
import { FileLogger } from '$lib/utils/log.server';

const checkoutSessionLogger = new FileLogger('CheckoutSession');

export const GET = (async ({ locals, url }) => {
    if (!locals.auth?.key) error(401, 'Invalid authentication');

    const lookupKey = url.searchParams.get('lookupKey');
    if (!lookupKey) error(400, 'lookupKey is required');

    const redirectUrl = await Subscription.createCheckoutSessionUrl(lookupKey);

    if (!redirectUrl) {
        await checkoutSessionLogger.error('Failed to create checkout session', {
            lookupKey
        });
        error(400, 'something went wrong');
    }

    return apiResponse(locals.auth, { redirectUrl });
}) satisfies RequestHandler;

export const POST = api404Handler;
export const PUT = api404Handler;
export const DELETE = api404Handler;
