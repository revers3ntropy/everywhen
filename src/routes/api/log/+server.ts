import type { RequestHandler } from '../../../../.svelte-kit/types/src/routes/api/locations/$types';
import { Auth } from '$lib/controllers/auth/auth.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { z } from 'zod';
import { api404Handler, apiResponse } from '$lib/utils/apiResponse.server';
import { SSLogger } from '$lib/controllers/logs/logs.server';

const logger = new SSLogger('CLIENT');

export const POST = (async ({ request, cookies }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    // don't invalidate cache here

    const body = await getUnwrappedReqBody(auth, request, {
        message: z.string(),
        level: z.string(),
        context: z.any()
    });

    await logger.withUserId(auth.id).writeLog(body.message, body.level, body.context, true);

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const GET = api404Handler;
export const PUT = api404Handler;
export const DELETE = api404Handler;
