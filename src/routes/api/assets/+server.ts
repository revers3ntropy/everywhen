import { Asset } from '$lib/controllers/asset/asset.server';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { api404Handler, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { Auth } from '$lib/controllers/auth/auth.server';
import { z } from 'zod';

export const GET = cachedApiRoute(async (auth, { url }) => {
    const count = parseInt(url.searchParams.get('count') || '4');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const [assets, assetCount] = (await Asset.pageOfMetaData(auth, offset, count)).unwrap(e =>
        error(400, e)
    );

    return { assets, assetCount };
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth, request, {
        content: z.string(),
        fileName: z.string()
    });

    const { id, publicId } = (await Asset.create(auth, body.content, body.fileName)).unwrap(e =>
        error(400, e)
    );

    return apiResponse(auth, { publicId, id });
}) satisfies RequestHandler;

export const DELETE = api404Handler;
export const PUT = api404Handler;
