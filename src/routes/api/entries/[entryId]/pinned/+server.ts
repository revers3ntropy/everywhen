import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry';
import { query } from '$lib/db/mysql.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async (auth, { params }) => {
    if (!params.entryId) throw error(400, 'invalid id');

    const { err, val: entry } = await Entry.fromId(query, auth, params.entryId, true);

    if (err) throw error(400, err);

    return { pinned: Entry.isPinned(entry) };
}) satisfies RequestHandler;

export const PUT = (async ({ request, params, cookies }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    if (!params.entryId) throw error(400, 'invalid id');
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(request, { pinned: 'boolean' }, { pinned: false });

    const { err: entryErr, val: entry } = await Entry.fromId(query, auth, params.entryId, true);
    if (entryErr) throw error(404, entryErr);

    const { err: updateErr } = await Entry.setPinned(query, auth, entry, body.pinned);
    if (updateErr) throw error(400, updateErr);

    return apiResponse(auth, { id: entry.id });
}) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
