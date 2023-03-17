import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { Entry } from '../../../../lib/controllers/entry';
import { query } from '../../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../../lib/security/getAuthFromCookies';
import { apiResponse } from '../../../../lib/utils/apiResponse';
import type { Mutable } from '../../../../lib/utils/types';

export const GET = (async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const { val: entries, err } = await Entry.all(query, auth);
    if (err) throw error(400, err);

    entries.map((entry: Mutable<Entry>) => {
        entry.entry = entry
            .entry
            .substring(0, 25)
            .replace(/[^0-9a-z ]/gi, '');
    });

    return apiResponse({ entries });
}) satisfies RequestHandler;
