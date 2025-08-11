import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { api404Handler, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { Auth } from '$lib/controllers/auth/auth.server';
import { Asset } from '$lib/controllers/asset/asset.server';

export const GET = cachedApiRoute(async (auth, { params }) => {
    if (!params['assetPublicId']) error(404, 'image not found');
    return (await Asset.fromPublicId(auth, params['assetPublicId'])).unwrap(e => error(404, e));
}) satisfies RequestHandler;

export const DELETE = (async ({ params, cookies }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    (await Asset.purgeWithPublicId(auth, params['assetPublicId'] || '')).unwrap(e => error(404, e));

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const POST = api404Handler satisfies RequestHandler;
export const PUT = api404Handler satisfies RequestHandler;
