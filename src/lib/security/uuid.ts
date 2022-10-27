import { v4 as UUIdv4 } from 'uuid';
import { query } from "$lib/db/mysql";

export async function generateUUId(): Promise<string> {
    let id = UUIdv4();

    while (true) {
        const result = await query`
            SELECT id FROM ids WHERE id = ${id}
        `;
        if (!result.length) break;
        id = UUIdv4();
    }

    await query`
        INSERT INTO ids VALUES (${id})
    `;

    return id;
}