import { api404Handler } from '$lib/utils/apiResponse.server';
import { cachedApiRoute } from '$lib/utils/cache.server';
import type { RequestHandler } from '@sveltejs/kit';
import { Subscription } from '$lib/controllers/subscription/subscription.server';

export const GET = cachedApiRoute(async _auth => {
    return { prices: Subscription.getPriceList() };
}) satisfies RequestHandler;

export const POST = api404Handler;
export const PUT = api404Handler;
export const DELETE = api404Handler;
