import { error } from '@sveltejs/kit';
import { Label } from '../../../lib/controllers/label';
import { query } from '../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';
import { apiResponse, getUnwrappedReqBody } from '../../../lib/utils';
import type { RequestHandler } from './$types';

export const GET = (async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const labels = await Label.all(query, auth);

    return apiResponse({ labels });
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const body = await getUnwrappedReqBody(request, {
        name: 'string',
        colour: 'string',
    }, {
        colour: 'black',
    });

    const { val: label, err } = await Label.create(query, auth, body);
    if (err) throw error(400, err);

    return apiResponse({ id: label.id });
}) satisfies RequestHandler;
