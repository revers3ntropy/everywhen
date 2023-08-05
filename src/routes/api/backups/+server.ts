import { BackupControllerServer } from '$lib/controllers/backup/backup.server';
import { error } from '@sveltejs/kit';
import { query } from '$lib/db/mysql.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { GETParamIsTruthy } from '$lib/utils/GETArgs';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async (auth, { url }) => {
    const encrypt = GETParamIsTruthy(url.searchParams.get('encrypted'));

    const { err, val: backup } = await BackupControllerServer.generate(query, auth);
    if (err) throw error(400, err);

    if (!encrypt) {
        return {
            data: JSON.stringify(backup)
        };
    }

    const encryptedResponse = BackupControllerServer.asEncryptedString(backup, auth.key);

    return { data: encryptedResponse };
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
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

    const { err } = await BackupControllerServer.restore(query, auth, body.data, body.key);
    if (err) throw error(400, err);

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
