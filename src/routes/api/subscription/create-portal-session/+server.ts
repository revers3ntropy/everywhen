import { error, type RequestHandler } from '@sveltejs/kit';
import { Subscription } from '$lib/controllers/subscription/subscription.server';
import { api404Handler, apiResponse } from '$lib/utils/apiResponse.server';
import { SSLogger } from '$lib/controllers/logs/logs.server';

const portalSessionLogger = new SSLogger('PortalSession');

export const GET = (async ({ locals }) => {
    if (!locals.auth) error(401, 'Invalid authentication');

    const redirectUrl = await Subscription.createPortalSessionUrl(locals.auth);

    if (!redirectUrl) {
        await portalSessionLogger.error('Failed to create portal session', { redirectUrl });
        error(400, 'something went wrong');
    }

    return apiResponse(locals.auth, { redirectUrl });
}) satisfies RequestHandler;

export const POST = api404Handler;
export const PUT = api404Handler;
export const DELETE = api404Handler;
