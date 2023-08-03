import { AssetControllerServer } from '$lib/controllers/asset/asset.server';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { query } from '$lib/db/mysql.server';
import { getAuthFromCookies } from '$lib/security/getAuthFromCookies';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';

const IMG_QUALITY = 100;

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

    const { err, val } = await AssetControllerServer.pageOfMetaData(query, auth, offset, count);
    if (err) throw error(400, err);

    return {
        assets: val[0],
        assetCount: val[1]
    };
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(request, {
        content: 'string',
        fileName: 'string'
    });

    const fileExt = body.fileName.split('.').pop();
    if (!fileExt) throw error(400, 'No file extension provided');

    let img;
    if (fileExt.toLowerCase() === 'webp') {
        img = body.content.replace(/^data:image\/webp;base64,/, '');
    } else {
        img = await AssetControllerServer.base64ToWebP(body.content, fileExt, IMG_QUALITY);
    }

    const { err, val } = await AssetControllerServer.create(query, auth, body.fileName, img);
    if (err) throw error(400, err);

    return apiResponse(val);
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
