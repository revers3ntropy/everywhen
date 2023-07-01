import type { QueryFunc } from '$lib/db/mysql';
import { v4 as UUIdv4 } from 'uuid';
import type { UUId as _UUId } from './uuid';
export type UUId = _UUId;

namespace UUIdUtils {
    export async function generateUUId(query: QueryFunc): Promise<string> {
        let id = UUIdv4();

        while (await uuidExists(query, id)) {
            id = UUIdv4();
        }

        await query.unlogged`
            INSERT INTO ids
            VALUES (${id})
        `;

        return id;
    }

    export async function uuidExists(query: QueryFunc, id: UUId) {
        const res = await query.unlogged<{ id: string }[]>`
            SELECT id
            FROM ids
            WHERE id = ${id}
        `;
        return res.length > 0;
    }
}

export const UUId = { ...UUIdUtils };
