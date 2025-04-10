import { api404Handler, apiResponse } from '$lib/utils/apiResponse.server';
import { isProd } from '$lib/utils/env';
import type { RequestHandler } from '@sveltejs/kit';
import { Subscription } from '$lib/controllers/subscription/subscription.server';

/**
 * endpoints for settings up test accounts in non-prod environments
 */

export const POST = (async event => {
    if (isProd() || !event.locals.auth) return api404Handler(event);
    await Subscription.upgradeAccountWithoutPayment(event.locals.auth.id);
    return apiResponse(event.locals.auth, { ok: true });
}) satisfies RequestHandler;

export const DELETE = (async event => {
    if (isProd() || !event.locals.auth) return api404Handler(event);
    await Subscription.clearSubscriptionsWithoutChecking(event.locals.auth.id);
    return apiResponse(event.locals.auth, { ok: true });
}) satisfies RequestHandler;

export const GET = api404Handler;
export const PUT = api404Handler;
