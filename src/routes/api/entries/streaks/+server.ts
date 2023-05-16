import { getAuthFromCookies } from '$lib/security/getAuthFromCookies';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry';
import { query } from '$lib/db/mysql';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse';

export const GET = (async ({ cookies }) => {
    // Don't cache this API route, as otherwise the user's streaks will be
    // cached and won't update until the cache expires,
    // when ideally they would be cached until the end
    // of the day (but when is that)
    const auth = await getAuthFromCookies(cookies);
    const { val: streaks, err } = await Entry.getStreaks(query, auth);
    if (err) throw error(400, err);
    return apiResponse({ ...streaks });
}) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
export const PUT = apiRes404;
