import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { Asset } from '$lib/controllers/asset';
import { query } from '$lib/db/mysql';
import { getAuthFromCookies } from '$lib/security/getAuthFromCookies';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse';
import { invalidateCache } from '$lib/utils/cache';
import { getUnwrappedReqBody } from '$lib/utils/requestBody';

const IMG_QUALITY = 100;

export const POST = (async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(request, {
        content: 'string',
        fileName: 'string'
    });

    const fileExt = body.fileName.split('.').pop();
    if (!fileExt) throw error(400, 'No file extension provided');

    const img = await Asset.base64ToWebP(body.content, fileExt, IMG_QUALITY);

    const { err, val: id } = await Asset.create(
        query,
        auth,
        body.fileName,
        img
    );
    if (err) throw error(400, err);

    return apiResponse({ id });
}) satisfies RequestHandler;

export const GET = apiRes404;
export const DELETE = apiRes404;
export const PUT = apiRes404;
