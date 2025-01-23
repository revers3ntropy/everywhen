import { error, redirect, type RequestHandler } from '@sveltejs/kit';
import { Subscription } from '$lib/controllers/subscription/subscription.server';
import { api404Handler } from '$lib/utils/apiResponse.server';
import { FileLogger } from '$lib/utils/log.server';

const portalSessionLogger = new FileLogger('PortalSession');

export const POST = (async ({ request, locals }) => {
    if (!locals.auth?.key) error(401, 'Invalid authentication');

    const body = Object.fromEntries(await request.formData());
    if (!('sessionId' in body) || typeof body['sessionId'] !== 'string' || !body['sessionId']) {
        error(400, 'sessionId is required');
    }
    const redirectUrl = await Subscription.createPortalSessionUrl(body['sessionId']);

    if (!redirectUrl) {
        await portalSessionLogger.error('Failed to create portal session', {
            body
        });
        error(400, 'something went wrong');
    }

    return redirect(303, redirectUrl);
}) satisfies RequestHandler;

export const GET = api404Handler;
export const PUT = api404Handler;
export const DELETE = api404Handler;
