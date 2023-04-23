import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { Asset } from '../../../lib/controllers/asset';
import { query } from '../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';
import { apiRes404, apiResponse } from '../../../lib/utils/apiResponse';
import { invalidateCache } from '../../../lib/utils/cache';
import { getUnwrappedReqBody } from '../../../lib/utils/requestBody';

export const POST = (async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(request, {
        content: 'string',
        fileName: 'string'
    });

    const { err, val } = await Asset.create(
        query,
        auth,
        body.fileName,
        body.content
    );
    if (err) throw error(400, err);

    return apiResponse({ id: val });
}) satisfies RequestHandler;

export const GET = apiRes404;
export const DELETE = apiRes404;
export const PUT = apiRes404;
