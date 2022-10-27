import { getKeyFromCookie } from "../../../../lib/security/getKeyFromCookie";
import { query } from "$lib/db/mysql";
import type { RequestHandler } from "@sveltejs/kit";
import { addLabelsToEntries, decryptEntries } from "../utils.server";
import type { RawEntry } from "$lib/types";

export const GET: RequestHandler = async ({ cookies, url }) => {
    const key = getKeyFromCookie(cookies);

    const entries = await query`
        SELECT 
            id,
            created,
            title,
            deleted,
            label,
            entry
        FROM entries
        WHERE deleted = 0
        ORDER BY created DESC, id
    `;

    const response = {
        entries: decryptEntries(await addLabelsToEntries(entries as RawEntry[], key), key)
    };

    response.entries.map((entry) => {
        entry.entry = entry.entry
            .substring(0, 25)
            .replace(/[^0-9a-z ]/gi, '');
    });

    return new Response(
        JSON.stringify(response),
        { status: 200 }
    );
};