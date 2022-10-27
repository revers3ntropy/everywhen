import { error } from '@sveltejs/kit';
import type { PageServerLoad } from "./$types";
import { query } from "../../../lib/db/mysql";
import { addLabelsToEntry, decryptEntry } from "../../api/entries/utils.server";
import { getKeyFromCookie } from "../../../lib/security/getKeyFromCookie";
import type { RawEntry } from "../../../lib/types";

export const load: PageServerLoad = async ({ params, cookies }) => {
    const key = getKeyFromCookie(cookies);
    const id = params.entryId;
    if (!id) throw error(404, 'Not found');

    const entry = await query`
        SELECT
            id,
            title,
            entry,
            label,
            longitude,
            latitude,
            created,
            deleted
        FROM entries
        WHERE id = ${id}
    `;

    if (!entry.length) throw error(404, 'Not found');

    return decryptEntry(await addLabelsToEntry(entry[0] as RawEntry, key), key);
}