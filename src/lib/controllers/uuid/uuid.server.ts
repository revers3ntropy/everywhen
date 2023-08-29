import { v4 as UUIdv4 } from 'uuid';
import { query } from '$lib/db/mysql.server';

export namespace UId.Server {
    const BUFFER_SIZE = 10;

    const buffer: string[] = [];

    function generateId(): string {
        return UUIdv4().replace(/-/g, '');
    }

    async function uuidExists(id: string): Promise<boolean> {
        const res = await query.unlogged<{ id: string }[]>`
            SELECT id FROM ids WHERE id = ${id}
        `;
        return res.length > 0;
    }

    async function idHasBeenUsed(id: string): Promise<void> {
        await query.unlogged`
            INSERT INTO ids VALUES (${id})
        `;
    }

    async function repopulateBuffer(): Promise<void> {
        while (buffer.length < BUFFER_SIZE) {
            const id = generateId();
            if (await uuidExists(id)) continue;

            buffer.push(id);
            await idHasBeenUsed(id);
        }
    }

    async function getSingleUniqueId(): Promise<string> {
        let id = generateId();
        while (await uuidExists(id)) {
            id = generateId();
        }

        await idHasBeenUsed(id);
        return id;
    }

    export async function generate(): Promise<string> {
        const fromBuffer = buffer.pop();
        if (fromBuffer) return fromBuffer;
        await repopulateBuffer();
        return await getSingleUniqueId();
    }
}
