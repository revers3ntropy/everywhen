import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { query } from "../../../lib/db/mysql";
import { addLabelsToEntry, decryptEntry } from "../../api/entries/utils.server";
import { getAuthFromCookies } from "../../../lib/security/getAuthFromCookies";
import type { RawEntry } from "../../../lib/types";

export const prerender = false;

export const load: PageServerLoad = async ({ params, cookies }) => {
    const { key, id: userId } = await getAuthFromCookies(cookies);
    const id = params.entryId;
    if (!id) throw error(404, "Not found");

    const entry = await query`
        SELECT entries.id,
               entries.title,
            entries.entry,
            entries.label,
            entries.longitude,
            entries.latitude,
            entries.created,
            entries.deleted
        FROM entries, users
        WHERE entries.id = ${id}
			AND entries.user = users.id
			AND users.id = ${userId}
    `;

	if (!entry.length) throw error(404, 'Not found');

	return decryptEntry(await addLabelsToEntry(entry[0] as RawEntry, key), key);
};
