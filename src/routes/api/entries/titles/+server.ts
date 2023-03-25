import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { Entry } from '../../../../lib/controllers/entry';
import { query } from '../../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../../lib/security/getAuthFromCookies';
import { apiResponse } from '../../../../lib/utils/apiResponse';

export const GET = (async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const { val: entries, err } = await Entry.getTitles(query, auth);
    if (err) throw error(400, err);

    return apiResponse({ entries });
}) satisfies RequestHandler;
