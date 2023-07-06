import type { QueryFunc } from '$lib/db/mysql.server';
import { v4 as UUIdv4 } from 'uuid';
import type { UUId as _UUId } from './uuid';

export type UUId = _UUId;

namespace UUIdUtils {
    function getUUId(): string {
        return UUIdv4().replace(/-/g, '');
    }

    async function uuidExists(query: QueryFunc, id: UUId) {
        const res = await query.unlogged<{ id: string }[]>`
            SELECT id
            FROM ids
            WHERE id = ${id}
        `;
        return res.length > 0;
    }

    export async function generateUniqueUUId(query: QueryFunc): Promise<string> {
        let id = getUUId();

        while (await uuidExists(query, id)) {
            id = getUUId();
        }

        await query.unlogged`
            INSERT INTO ids
            VALUES (${id})
        `;

        return id;
    }
}

export const UUId = UUIdUtils;
