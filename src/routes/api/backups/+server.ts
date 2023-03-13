import { error } from '@sveltejs/kit';
import { Backup } from '../../../lib/controllers/backup';
import { query } from '../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';
import { getUnwrappedReqBody } from '../../../lib/utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const { err, val: backup } = await Backup.generate(query, auth);
    if (err) throw error(400, err);
    const encryptedResponse = backup.asEncryptedString(auth);

    return new Response(
        JSON.stringify({ data: encryptedResponse }),
        { status: 200 },
    );
};

export const POST: RequestHandler = async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const body = await getUnwrappedReqBody(request, {
        data: 'string',
    });

    const { err } = await Backup.restore(query, auth, body.data);
    if (err) throw error(400, err);

    return new Response(
        JSON.stringify({}),
        { status: 200 },
    );
};