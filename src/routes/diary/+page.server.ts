export {};
/*
import type { PageServerLoad } from "./$types";
import { query } from "$lib/db/mysql";
import { decryptEntries } from "../api/entries/_helper";
import { getKeyFromRequest } from "../../lib/security/getKeyFromRequest";

export const load: PageServerLoad = async ({ cookies }) => {
    const key = getKeyFromRequest(cookies);
    const entries = await query`
        SELECT 
            id,
            created,
            latitude,
            longitude,
            title,
            entry,
            deleted,
            label
        FROM entries
        ORDER BY created DESC, id
        LIMIT 50
    `;

    const numEntries = await query`
        SELECT COUNT(*) as count
        FROM entries
    `;

    return {
        entries: decryptEntries(entries, key),
        totalPages: Math.ceil(numEntries[0].count / 50)
    };
}
 */