import type { RequestHandler } from '@sveltejs/kit';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';
import { getUnwrappedReqBody } from '../../../lib/utils';

export const POST: RequestHandler = async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const body = await getUnwrappedReqBody(request, {
        content: 'string',
        fileName: 'string',
    });

    console.log(body);

    return new Response(JSON.stringify({}), { status: 200 });
};