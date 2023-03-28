import { error } from '@sveltejs/kit';
import { Backup } from '../../../lib/controllers/backup';
import { query } from '../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';
import { apiRes404, apiResponse } from '../../../lib/utils/apiResponse';
import { GETParamIsTruthy } from '../../../lib/utils/GETArgs';
import { getUnwrappedReqBody } from '../../../lib/utils/requestBody';
import type { RequestHandler } from './$types';

export const GET = (async ({ cookies, url }) => {
    const auth = await getAuthFromCookies(cookies);

    const encrypt = GETParamIsTruthy(url.searchParams.get('encrypted'));

    const { err, val: backup } = await Backup.generate(query, auth);
    if (err) throw error(400, err);
    const {
        err: encryptErr,
        val: encryptedResponse,
    } = Backup.asEncryptedString(backup, auth);
    if (encryptErr) throw error(400, encryptErr);

    if (!encrypt) {
        return apiResponse({
            data: JSON.stringify(backup),
        });
    }

    return apiResponse({ data: encryptedResponse });
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const body = await getUnwrappedReqBody(request, {
        data: 'string',
        key: 'string',
        isEncrypted: 'boolean',
    }, {
        key: auth.key,
        isEncrypted: true,
    });

    const { err } = await Backup.restore(
        query, auth,
        body.data,
        body.key,
    );
    if (err) throw error(400, err);

    return apiResponse({});
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
