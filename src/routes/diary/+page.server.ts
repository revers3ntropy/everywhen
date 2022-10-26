import type { PageServerLoad } from "./$types";
import { query } from "$lib/db/mysql";

export const load: PageServerLoad = async ({ }) => {
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
        LIMIT 50
    `;

    return { entries };
}