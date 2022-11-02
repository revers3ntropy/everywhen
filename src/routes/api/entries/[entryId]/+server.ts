import { getAuthFromCookies } from "$lib/security/getAuthFromCookies";
import { error } from "@sveltejs/kit";
import { query } from "$lib/db/mysql";
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ request, params, cookies }) => {
    const { id: userId } = await getAuthFromCookies(cookies);
    const id = params.entryId;
    const { restore } = await request.json();

    if (typeof id !== 'string' || !id) {
        throw error(400, 'invalid id');
    }

    const entry = await query`
        SELECT deleted
        FROM entries
        WHERE id = ${id}
    `;

    if (!entry.length) {
        throw error(404, 'Entry not found');
    }
    if (!!entry[0].deleted === !restore) {
        throw error(400, 'Entry is already in that state');
    }

    await query`
        UPDATE entries, users
        SET entries.deleted = ${!restore}
        WHERE entries.id = ${id}
		  AND entries.user = users.id
		  AND users.id = ${userId}
   `;

    return new Response(JSON.stringify({ id }), { status: 200 });
};
