import { v4 as UUIdv4 } from 'uuid';
import type { QueryFunc } from '../db/mysql';

export class UUID {
    public static async generateUUId (query: QueryFunc): Promise<string> {
        let id = UUIdv4();

        while (await UUID.uuidExists(query, id)) {
            id = UUIdv4();
        }

        await query`
            INSERT INTO ids
            VALUES (${id})
        `;

        return id;
    }

    private static async uuidExists (query: QueryFunc, id: string) {
        const res = await query<{ id: string }[]>`
            SELECT id
            FROM ids
            WHERE id = ${id}
        `;
        return res.length > 0;
    }
}