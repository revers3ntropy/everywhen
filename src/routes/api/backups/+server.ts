import { error } from '@sveltejs/kit';
import { Backup } from '../../../lib/controllers/backup';
import { query } from '../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';
import { apiResponse } from '../../../lib/utils/apiResponse';
import { getUnwrappedReqBody } from '../../../lib/utils/requestBody';
import type { RequestHandler } from './$types';

export const GET = (async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const { err, val: backup } = await Backup.generate(query, auth);
    if (err) throw error(400, err);
    const encryptedResponse = backup.asEncryptedString(auth);

    return apiResponse({ data: encryptedResponse });
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const body = await getUnwrappedReqBody(request, {
        data: 'string',
    });

    const { err } = await Backup.restore(query, auth, body.data);
    if (err) throw error(400, err);

    return apiResponse({});
}) satisfies RequestHandler;