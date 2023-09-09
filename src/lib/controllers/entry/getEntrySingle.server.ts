import type { Auth } from '$lib/controllers/auth/auth.server';
import type { EntryEdit, RawEntry } from '$lib/controllers/entry/entry';
import { Entry } from '$lib/controllers/entry/entry.server';
import { Label } from '$lib/controllers/label/label.server';
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

    if (entries.length !== 1) return Result.err('Entry not found');

    const [entry] = entries;
    if (mustNotBeDeleted && Entry.isDeleted(entry)) return Result.err('Entry is deleted');

    const { val: labels, err: labelErr } = await Label.allIndexedById(auth);
    if (labelErr) return Result.err(labelErr);

    return await fromRaw(auth, entry, labels);
}

async function fromRaw(
    auth: Auth,
    rawEntry: RawEntry,
    labels: Record<string, Label>
): Promise<Result<Entry>> {
    const { err: titleErr, val: decryptedTitle } = decrypt(rawEntry.title, auth.key);
    if (titleErr) return Result.err(titleErr);

    const { err: entryErr, val: decryptedEntry } = decrypt(rawEntry.body, auth.key);
    if (entryErr) return Result.err(entryErr);

    let decryptedAgent = '';
    if (rawEntry.agentData) {
        const { err: agentErr, val } = decrypt(rawEntry.agentData, auth.key);
        if (agentErr) return Result.err(agentErr);
        decryptedAgent = val;
    }

    let label: null | Label = null;
    if (rawEntry.labelId) {
        label = labels[rawEntry.labelId];
        if (!label) {
            void logger.error('Label not found', { rawEntry, label, labels });
            return Result.err('Label not found');
        }
    }

    const editsRes = await getEditsForEntry(auth, rawEntry.id, labels);
    if (!editsRes.ok) return editsRes.cast();

    return Result.ok({
        id: rawEntry.id,
        title: decryptedTitle,
        body: decryptedEntry,
        created: rawEntry.created,
        createdTzOffset: rawEntry.createdTzOffset,
        pinned: rawEntry.pinned,
        deleted: rawEntry.deleted,
        latitude: rawEntry.latitude,
        longitude: rawEntry.longitude,
        agentData: decryptedAgent,
        wordCount: rawEntry.wordCount,
        label,
        edits: editsRes.val
    });
}

async function getEditsForEntry(
    auth: Auth,
    entryId: string,
    labels: Record<string, Label>
): Promise<Result<EntryEdit[]>> {
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

    return Result.collect(rawEdits.map(e => Entry.editFromRaw(auth, labels, e)));
}
