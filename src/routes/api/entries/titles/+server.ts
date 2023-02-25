import { getAuthFromCookies } from '$lib/security/getAuthFromCookies';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { Entry } from '../../../../lib/controllers/entry';
import type { Mutable } from '../../../../lib/utils';

export const GET: RequestHandler = async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const { val: entries, err } = await Entry.getAll(auth);
    if (err) throw error(400, err);

    entries.map((entry: Mutable<Entry>) => {
        entry.entry = entry.entry
                           .substring(0, 25)
                           .replace(/[^0-9a-z ]/gi, '');
    });

    return new Response(JSON.stringify({
        entries
    }), { status: 200 });
};
