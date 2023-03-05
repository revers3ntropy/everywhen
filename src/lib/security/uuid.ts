import { v4 as UUIdv4 } from 'uuid';
import type { QueryFunc } from '../db/mysql';

async function uuidExists (query: QueryFunc, id: string) {
    const res = await query`
        SELECT id
        FROM ids
        WHERE id = ${id}
    `;
    return res.length > 0;
}

export async function generateUUId (query: QueryFunc): Promise<string> {
    let id = UUIdv4();

    while (await uuidExists(query, id)) {
        id = UUIdv4();
    }

    await query`
        INSERT INTO ids
        VALUES (${id})
    `;

    return id;
}
