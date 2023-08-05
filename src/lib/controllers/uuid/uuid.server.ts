import { v4 as UUIdv4 } from 'uuid';
import type { UUId } from '$lib/controllers/uuid/uuid';
import { query } from '$lib/db/mysql.server';

export namespace UUIdControllerServer {
    function getUUId(): string {
        return UUIdv4().replace(/-/g, '');
    }

    async function uuidExists(id: UUId) {
        const res = await query.unlogged<{ id: string }[]>`
            SELECT id FROM ids WHERE id = ${id}
        `;
        return res.length > 0;
    }

    export async function generate(): Promise<string> {
        let id = getUUId();

        while (await uuidExists(id)) {
            id = getUUId();
        }

        await query.unlogged`
            INSERT INTO ids VALUES (${id})
        `;

        return id;
    }
}
