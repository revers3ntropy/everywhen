import { Asset } from '$lib/controllers/asset/asset.server';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async (auth, { url }) => {
    let offset: number, count: number;
    try {
        count = parseInt(url.searchParams.get('count') || '4');
    } catch (e) {
        throw error(400, 'Invalid count');
    }
    try {
        offset = parseInt(url.searchParams.get('offset') || '0');
    } catch (e) {
        throw error(400, 'Invalid offset');
    }

    const { err, val } = await Asset.Server.pageOfMetaData(auth, offset, count);
    if (err) throw error(400, err);

    return {
        assets: val[0],
        assetCount: val[1]
    };
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth, request, {
        content: 'string',
        fileName: 'string'
    });

    const fileExt = body.fileName.split('.').pop();
    if (!fileExt) throw error(400, 'No file extension provided');

    const { err, val } = await Asset.Server.create(auth, body.content, body.fileName);
    if (err) throw error(400, err);

    return apiResponse(auth, val);
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
