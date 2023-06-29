import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry';
import { query } from '$lib/db/mysql';
import { getAuthFromCookies } from '$lib/security/getAuthFromCookies';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache';
import { getUnwrappedReqBody } from '$lib/utils/requestBody';
import type { RequestHandler } from './$types';

export const GET = cachedApiRoute(async (auth, { params }) => {
    if (!params.entryId) throw error(400, 'invalid id');

    const { err, val: entry } = await Entry.fromId(query, auth, params.entryId, true);

    if (err) throw error(400, err);

    return { pinned: Entry.isPinned(entry) };
}) satisfies RequestHandler;

export const PUT = (async ({ request, params, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    if (!params.entryId) throw error(400, 'invalid id');
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(request, { pinned: 'boolean' }, { pinned: false });

    const { err: entryErr, val: entry } = await Entry.fromId(query, auth, params.entryId, true);
    if (entryErr) throw error(404, entryErr);

    const { err: updateErr } = await Entry.setPinned(query, auth, entry, body.pinned);
    if (updateErr) throw error(400, updateErr);

    return apiResponse({ id: entry.id });
}) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
