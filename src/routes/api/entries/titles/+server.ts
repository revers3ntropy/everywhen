import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { Entry } from '../../../../lib/controllers/entry';
import { query } from '../../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../../lib/security/getAuthFromCookies';
import { apiRes404, apiResponse } from '../../../../lib/utils/apiResponse';

export const GET = (async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const { val: entries, err } = await Entry.getTitles(query, auth);
    if (err) throw error(400, err);

    return apiResponse({ entries });
}) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
export const PUT = apiRes404;
