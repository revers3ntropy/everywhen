import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { Asset } from '../../../lib/controllers/asset';
import { query } from '../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';
import { getUnwrappedReqBody } from '../../../lib/utils';

export const POST: RequestHandler = async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const body = await getUnwrappedReqBody(request, {
        content: 'string',
        fileName: 'string',
    });

    const { err, val } = await Asset.create(
        query, auth,
        body.fileName, body.content,
    );
    if (err) throw error(400, err);

    return new Response(
        JSON.stringify({ id: val }),
        {
            status: 200,
        });
};