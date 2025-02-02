import { api404Handler, apiResponse } from '$lib/utils/apiResponse.server';
import { invalidateCache } from '$lib/utils/cache.server';
import { error, type RequestHandler } from '@sveltejs/kit';

export const POST = (async ({ locals }) => {
    if (!locals.auth || !locals.auth.key) error(401, 'Invalid authentication');
    invalidateCache(locals.auth.id);

    // TODO

    return apiResponse(locals.auth, { ok: true });
}) satisfies RequestHandler;

export const GET = api404Handler;
export const PUT = api404Handler;
export const DELETE = api404Handler;
