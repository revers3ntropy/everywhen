import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { Asset } from '$lib/controllers/asset';
import { query } from '$lib/db/mysql';
import { getAuthFromCookies } from '$lib/security/getAuthFromCookies';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache';
import { getUnwrappedReqBody } from '$lib/utils/requestBody';

const IMG_QUALITY = 100;

export const GET = cachedApiRoute(async (auth, { url }) => {
    const count = parseInt(url.searchParams.get('count') || '4');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const { err, val } = await Asset.pageOfMetaData(query, auth, offset, count);
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
        img = await Asset.base64ToWebP(body.content, fileExt, IMG_QUALITY);
    }

    const { err, val } = await Asset.create(query, auth, body.fileName, img);
    if (err) throw error(400, err);

    return apiResponse(val);
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
