import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const PUT = (async ({ request, params, cookies }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    if (!params.entryId) error(400, 'invalid id');
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth, request, { pinned: z.boolean().default(false) });

    const entry = (await Entry.getFromId(auth, params.entryId, true)).unwrap(e => error(400, e));

    (await Entry.setPinned(auth, entry, body.pinned)).unwrap(e => error(400, e));

    return apiResponse(auth, { id: entry.id });
}) satisfies RequestHandler;

export const GET = apiRes404;
export const POST = apiRes404;
export const DELETE = apiRes404;
