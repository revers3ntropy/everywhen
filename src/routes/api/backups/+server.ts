import { error } from '@sveltejs/kit';
import { Backup } from '$lib/controllers/backup/backup';
import { query } from '$lib/db/mysql';
import { getAuthFromCookies } from '$lib/security/getAuthFromCookies';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache';
import { GETParamIsTruthy } from '$lib/utils/GETArgs';
import { getUnwrappedReqBody } from '$lib/utils/requestBody';
import type { RequestHandler } from './$types';

export const GET = cachedApiRoute(async (auth, { url }) => {
    const encrypt = GETParamIsTruthy(url.searchParams.get('encrypted'));

    const { err, val: backup } = await Backup.generate(query, auth);
    if (err) throw error(400, err);

    if (!encrypt) {
        return {
            data: JSON.stringify(backup)
        };
    }

    const { err: encryptErr, val: encryptedResponse } = Backup.asEncryptedString(backup, auth);
    if (encryptErr) throw error(400, encryptErr);

    return { data: encryptedResponse };
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(
        request,
        {
            data: 'string',
            key: 'string',
            isEncrypted: 'boolean'
        },
        {
            key: auth.key,
            isEncrypted: true
        }
    );

    const { err } = await Backup.restore(query, auth, body.data, body.key);
    if (err) throw error(400, err);

    return apiResponse({});
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
