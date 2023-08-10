import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import {
    apiRes404,
    apiResponse,
    type GenericResponse,
    rawApiResponse
} from '$lib/utils/apiResponse.server';
import { cacheResponse, getCachedResponse, invalidateCache } from '$lib/utils/cache.server';
import { Auth } from '$lib/controllers/auth/auth.server';
import { Asset } from '$lib/controllers/asset/asset.server';

export const GET = (async ({ params, url, cookies }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);

    const cached = getCachedResponse<Response>(url.href, auth.id);
    if (cached) return cached.clone() as GenericResponse<Buffer>;

    const { err, val: asset } = await Asset.Server.fromPublicId(auth, params['asset'] || '');
    if (err) throw error(404, err);

    const img = Buffer.from(asset.content, 'base64');
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
    const auth = Auth.Server.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const { err } = await Asset.Server.purgeWithPublicId(auth, params['asset'] || '');
    if (err) throw error(404, err);

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const POST = apiRes404 satisfies RequestHandler;
export const PUT = apiRes404 satisfies RequestHandler;
