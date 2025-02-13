import type { Auth } from '$lib/controllers/auth/auth.server';
import type { EntryEdit, RawEntry } from '$lib/controllers/entry/entry';
import { Entry } from '$lib/controllers/entry/entry.server';
import { query } from '$lib/db/mysql.server';
import { decrypt } from '$lib/utils/encryption';
import { FileLogger } from '$lib/utils/log.server';
import { Result } from '$lib/utils/result';

const logger = new FileLogger('1Entry');

/**
 * Returns a decrypted `Entry` with (optional) decrypted `Label`.
 */
export async function entryFromId(
    auth: Auth,
    id: string,
    mustNotBeDeleted = true
): Promise<Result<Entry>> {
    const entries = await query<
        {
            labelId: string | null;
            deleted: number | null;
            pinned: number | null;
            id: string;
            created: number;
            createdTzOffset: number;
            title: string;
            body: string;
            latitude: number | null;
            longitude: number | null;
            agentData: string;
            wordCount: number;
        }[]
    >`
        SELECT labelId,
               deleted,
               pinned,
               id,
               created,
               createdTzOffset,
               title,
               body,
               latitude,
               longitude,
               agentData,
               wordCount
        FROM entries
        WHERE id = ${id}
          AND userId = ${auth.id}
    `;

    if (entries.length !== 1) {
        if (entries.length !== 0) {
            void logger.error('Multiple entries found', { entries });
        }
        return Result.err('Entry not found');
    }

    const [entry] = entries;
    if (mustNotBeDeleted && Entry.isDeleted(entry)) return Result.err('Entry is deleted');

    return fromRaw(auth, entry);
}

async function fromRaw(auth: Auth, rawEntry: RawEntry): Promise<Result<Entry>> {
    const decryptedTitle = decrypt(rawEntry.title, auth.key);
    if (!decryptedTitle.ok) return decryptedTitle.cast();

    const decryptedBody = decrypt(rawEntry.body, auth.key);
    if (!decryptedBody.ok) return decryptedBody.cast();

    let decryptedAgent = '';
    if (rawEntry.agentData) {
        const res = decrypt(rawEntry.agentData, auth.key);
        if (!res.ok) return res.cast();
        decryptedAgent = res.val;
    }

    const editsRes = await getEditsForEntry(auth, rawEntry.id);
    if (!editsRes.ok) return editsRes.cast();

    return Result.ok({
        id: rawEntry.id,
        title: decryptedTitle.val,
        body: decryptedBody.val,
        created: rawEntry.created,
        createdTzOffset: rawEntry.createdTzOffset,
        pinned: rawEntry.pinned,
        deleted: rawEntry.deleted,
        latitude: rawEntry.latitude,
        longitude: rawEntry.longitude,
        agentData: decryptedAgent,
        wordCount: rawEntry.wordCount,
        labelId: rawEntry.labelId,
        edits: editsRes.val
    });
}

async function getEditsForEntry(auth: Auth, entryId: string): Promise<Result<EntryEdit[]>> {
    const rawEdits = await query<
        {
            id: string;
            entryId: string;
            created: number;
            createdTzOffset: number;
            latitude: number | null;
            longitude: number | null;
            oldTitle: string;
            oldBody: string;
            oldLabelId: string | null;
            agentData: string;
        }[]
    >`
        SELECT 
            id,
            entryId,
            created,
            createdTzOffset,
            latitude,
            longitude,
            oldTitle,
            oldBody,
            oldLabelId,
            agentData
        FROM entryEdits
        WHERE entryEdits.entryId = ${entryId}
            AND userId = ${auth.id}
        ORDER BY created DESC
    `;

    return Result.collect(rawEdits.map(e => Entry.editFromRaw(auth, e)));
}
