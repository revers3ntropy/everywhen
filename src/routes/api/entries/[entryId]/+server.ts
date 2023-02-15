import { getAuthFromCookies } from "$lib/security/getAuthFromCookies";
import { error } from "@sveltejs/kit";
import { query } from "$lib/db/mysql";
import type { RequestHandler } from "./$types";
import type { RawEntry } from "$lib/types";

export const DELETE: RequestHandler = async ({ request, params, cookies }) => {
    const { id: userId } = await getAuthFromCookies(cookies);
    const id = params.entryId;
    const { restore } = await request.json();

    if (typeof id !== "string" || !id) {
        throw error(400, "invalid id");
    }

    const entry = await query`
        SELECT deleted
        FROM entries
        WHERE id = ${ id }
    `;

    if (!entry.length) {
        throw error(404, "Entry not found");
    }
    if (!!entry[0].deleted === !restore) {
        throw error(400, 'Entry is already in that state');
    }

    await query`
        UPDATE entries, users
        SET entries.deleted = ${ !restore },
            entries.label=${ null }
        WHERE entries.id = ${ id }
          AND entries.user = users.id
          AND users.id = ${ userId }
    `;

    return new Response(JSON.stringify({ id }), { status: 200 });
};

export const PUT: RequestHandler = async ({ request, params, cookies }) => {
    const { id: userId } = await getAuthFromCookies(cookies);
    const id = params.entryId;
    const { label } = <{ label: null | string }>await request.json();

    if (typeof id !== 'string' || !id) {
        throw error(400, 'invalid id');
    }
    if (label !== null && typeof label !== 'string') {
        throw error(400, 'invalid label');
    }

    const entry = await query<RawEntry[]>`
        SELECT entries.label, entries.deleted
        FROM entries,
             users
        WHERE entries.id = ${ id }
          AND entries.user = users.id
          AND users.id = ${ userId }
    `;

    if (!entry.length) {
        throw error(404, 'Entry not found');
    }
    if (entry[0].deleted) {
        throw error(400, 'Entry is deleted');
    }
    if (entry[0].label === label || (!label && !entry[0].label)) {
        throw error(400, 'Entry already has that label');
    }

    if (label !== null) {
        const labelExists = await query`
            SELECT labels.id
            FROM labels,
                 users
            WHERE labels.id = ${ label }
              AND labels.user = users.id
              AND users.id = ${ userId }
        `;
        if (!labelExists.length) {
            throw error(404, 'Label not found');
        }
    }

    await query`
        UPDATE entries, users
        SET entries.label = ${ label }
        WHERE entries.id = ${ id }
          AND entries.user = users.id
          AND users.id = ${ userId }
    `;

    return new Response(JSON.stringify({ id }), { status: 200 });
};