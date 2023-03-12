import { error } from '@sveltejs/kit';
import { Entry } from '../../../lib/controllers/entry';
import { query } from '../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';
import { wordCount } from '../../../lib/utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    let { val: entries, err } = await Entry.all(query, auth);
    if (err) throw error(400, err);

    let response = entries.map(e => ({
        id: e.id,
        created: e.created,
        title: e.title,
        wordCount: wordCount(e.entry),
    }));

    return new Response(
        JSON.stringify({ entries: response }),
        { status: 200 },
    );
};
