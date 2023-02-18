import { getAuthFromCookies } from "$lib/security/getAuthFromCookies";
import { query } from "$lib/db/mysql";
import type { RequestHandler } from '@sveltejs/kit';
import { addLabelsToEntries, decryptEntries } from '../utils.server';
import type { RawEntry } from '$lib/types';

export const GET: RequestHandler = async ({ cookies }) => {
	const { key, id } = await getAuthFromCookies(cookies);

    const entries = await query`
        SELECT entries.id,
               entries.created,
               entries.title,
               entries.deleted,
               entries.label,
               entries.entry
        FROM entries,
             users
        WHERE deleted = 0
          AND entries.user = users.id
          AND users.id = ${ id }
        ORDER BY created DESC, id
    `;

    const response = {
        entries: decryptEntries(
            await addLabelsToEntries(entries as RawEntry[], key),
            key
        )
    };

    response.entries.map((entry) => {
        entry.entry = entry.entry.substring(0, 25).replace(/[^0-9a-z ]/gi, "");
    });

    return new Response(JSON.stringify(response), { status: 200 });
};
