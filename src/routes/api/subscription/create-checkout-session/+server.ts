import { error, redirect, type RequestHandler } from '@sveltejs/kit';
import { Subscription } from '$lib/controllers/subscription/subscription.server';
import { api404Handler } from '$lib/utils/apiResponse.server';
import { FileLogger } from '$lib/utils/log.server';

const checkoutSessionLogger = new FileLogger('CheckoutSession');

export const POST = (async ({ request, locals }) => {
    if (!locals.auth?.key) error(401, 'Invalid authentication');

    const body = Object.fromEntries(await request.formData());
    if (!('lookupKey' in body) || typeof body['lookupKey'] !== 'string' || !body['lookupKey']) {
        error(400, 'lookupKey is required');
    }
    const redirectUrl = await Subscription.createCheckoutSessionUrl(body['lookupKey']);

    if (!redirectUrl) {
        await checkoutSessionLogger.error('Failed to create checkout session', {
            body
        });
        error(400, 'something went wrong');
    }

    return redirect(303, redirectUrl);
}) satisfies RequestHandler;

export const GET = api404Handler;
export const PUT = api404Handler;
export const DELETE = api404Handler;
