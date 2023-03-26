import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { Asset } from '../../../../lib/controllers/asset';
import { query } from '../../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../../lib/security/getAuthFromCookies';
import { apiRes404 } from '../../../../lib/utils/apiResponse';

export const GET: RequestHandler = async ({ params, cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const { err, val: asset } = await Asset.fromPublicId(
        query, auth,
        params.asset || '',
    );
    if (err) throw error(404, err);

    const imgB64 = asset
        .content
        .replace(
            /^data:image\/((jpeg)|(jpg)|(png));base64,/,
            '',
        );

    const img = Buffer.from(imgB64, 'base64');

    return new Response(
        img,
        {
            status: 200,
            headers: {
                'Content-Type': asset.contentType,
                'Cache-Control': 'max-age=31536000, immutable',
                'Content-Length': img.length,
                // doesn't like Content-Length for some reason
            } as unknown as HeadersInit,
        },
    );
};

export const POST = apiRes404;
export const DELETE = apiRes404;
export const PUT = apiRes404;