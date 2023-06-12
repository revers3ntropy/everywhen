import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { Asset } from '$lib/controllers/asset';
import { query } from '$lib/db/mysql';
import { getAuthFromCookies } from '$lib/security/getAuthFromCookies';
import {
    apiRes404,
    apiResponse,
    type GenericResponse,
    rawApiResponse
} from '$lib/utils/apiResponse';
import {
    cacheResponse,
    getCachedResponse,
    invalidateCache
} from '$lib/utils/cache';

export const GET = (async ({ params, url, cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const cached = getCachedResponse<Response>(url.href, auth.id)?.clone();
    if (cached) return cached as GenericResponse<Buffer>;

    const { err, val: asset } = await Asset.fromPublicId(
        query,
        auth,
        params.asset || ''
    );
    if (err) throw error(404, err);

    let img;
    // backwards compatibility with old image formats
    if (/^data:image\/((jpeg)|(jpg)|(png));base64,/i.test(asset.content)) {
        console.log('\n\n   !! Converting image to webp\n\n');
        const webP = await Asset.base64ToWebP(
            asset.content,
            asset.contentType.split('/')[1],
            100
        );
        img = Buffer.from(webP, 'base64');
        void Asset.updateAssetContentToWebP(query, auth, asset.publicId, webP);
    } else {
        img = Buffer.from(asset.content, 'base64');
    }

    const response = rawApiResponse(img, {
        status: 200,
        headers: {
            'Content-Type': 'image/webp',
            'Cache-Control': 'max-age=31536000, immutable',
            'Content-Length': `${img.length}`
        }
    });

    cacheResponse(url.href, auth.id, response.clone());
    return response;
}) satisfies RequestHandler;

export const DELETE = (async ({ params, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const { err } = await Asset.purgeWithPublicId(
        query,
        auth,
        params.asset || ''
    );
    if (err) throw error(404, err);

    return apiResponse({});
}) satisfies RequestHandler;

export const POST = apiRes404 satisfies RequestHandler;
export const PUT = apiRes404 satisfies RequestHandler;
