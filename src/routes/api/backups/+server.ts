import { Backup } from '$lib/controllers/backup/backup.server';
import { error } from '@sveltejs/kit';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { GETParamIsTruthy } from '$lib/utils/GETArgs';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async (auth, { url }) => {
    const encrypt = GETParamIsTruthy(url.searchParams.get('encrypted'));

    const backup = (await Backup.generate(auth)).unwrap(e => error(400, e));

    if (!encrypt) {
        return { data: JSON.stringify(backup) };
    }

    const encryptedResponse = Backup.asEncryptedString(backup, auth.key);

    return { data: encryptedResponse };
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth, request, {
        data: z.string(),
        key: z.string().default(auth.key),
        isEncrypted: z.boolean().default(true)
    });

    (await Backup.restore(auth, body.data, body.key)).unwrap(e => error(400, e));

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
