import { v4 as UUIdv4 } from "uuid";
import { query } from "$lib/db/mysql";

async function uuidExists (id: string) {
    const res = await query`
        SELECT id
        FROM ids
        WHERE id = ${ id }
    `;
    return res.length > 0;
}

export async function generateUUId (): Promise<string> {
    let id = UUIdv4();

    while (await uuidExists(id)) {
        id = UUIdv4();
    }

    await query`
        INSERT INTO ids
        VALUES (${ id })
    `;

    return id;
}
