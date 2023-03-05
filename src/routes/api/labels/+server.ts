import { error } from '@sveltejs/kit';
import { Label } from '../../../lib/controllers/label';
import { query } from '../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';
import { getUnwrappedReqBody } from '../../../lib/utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const labels = await Label.all(query, auth);

    return new Response(
        JSON.stringify({ labels }),
        { status: 200 },
    );
};

export const POST: RequestHandler = async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const body = await getUnwrappedReqBody(request, {
        name: 'string',
        colour: 'string',
    }, {
        colour: 'black',
    });

    const { val: label, err } = await Label.create(query, auth, body);
    if (err) throw error(400, err);

    return new Response(
        JSON.stringify({ id: label.id }),
        { status: 201 },
    );
};
