import type { Auth } from '$lib/controllers/auth/auth.server';
import type { RawEntry, RawEntryEdit } from '$lib/controllers/entry/entry';
import { Entry } from '$lib/controllers/entry/entry.server';
import { Label } from '$lib/controllers/label/label.server';
import { query } from '$lib/db/mysql.server';
import { decrypt } from '$lib/utils/encryption';
import { errorLogger } from '$lib/utils/log.server';
import { Result } from '$lib/utils/result';

/**
 * Returns a decrypted `Entry` with (optional) decrypted `Label`.
 */
export async function entryFromId(
    auth: Auth,
    id: string,
    mustNotBeDeleted = true
): Promise<Result<Entry>> {
    const entries = await query<RawEntry[]>`
        SELECT label,
               deleted,
               pinned,
               id,
               created,
               createdTZOffset,
               title,
               entry,
               latitude,
               longitude,
               agentData,
               wordCount
        FROM entries
        WHERE id = ${id}
          AND user = ${auth.id}
    `;

    if (entries.length !== 1) {
        return Result.err('Entry not found');
    }
    const [entry] = entries;
    if (mustNotBeDeleted && Entry.isDeleted(entry)) {
        return Result.err('Entry is deleted');
    }

    const { val: labels, err: labelErr } = await Label.Server.all(auth);
    if (labelErr) return Result.err(labelErr);

    return await fromRaw(auth, entry, labels);
}

async function fromRaw(auth: Auth, rawEntry: RawEntry, labels: Label[]): Promise<Result<Entry>> {
    const { err: titleErr, val: decryptedTitle } = decrypt(rawEntry.title, auth.key);
    if (titleErr) return Result.err(titleErr);

    const { err: entryErr, val: decryptedEntry } = decrypt(rawEntry.entry, auth.key);
    if (entryErr) return Result.err(entryErr);

    let decryptedAgent = '';
    if (rawEntry.agentData) {
        const { err: agentErr, val } = decrypt(rawEntry.agentData, auth.key);
        if (agentErr) return Result.err(agentErr);
        decryptedAgent = val;
    }

    let entry: Entry = {
        id: rawEntry.id,
        title: decryptedTitle,
        entry: decryptedEntry,
        created: rawEntry.created,
        createdTZOffset: rawEntry.createdTZOffset,
        pinned: rawEntry.pinned,
        deleted: rawEntry.deleted,
        latitude: rawEntry.latitude,
        longitude: rawEntry.longitude,
        agentData: decryptedAgent,
        wordCount: rawEntry.wordCount,
        label: null,
        edits: []
    };

    if (rawEntry.label) {
        const label = labels.find(l => l.id === rawEntry.label);
        if (!label) {
            await errorLogger.error('Label not found', rawEntry);
            return Result.err('Label not found');
        }
        entry = { ...entry, label };
    }

    const { err, val } = await addEdits(auth, entry, labels);
    if (err) return Result.err(err);
    entry = val;

    return Result.ok(entry);
}

async function addEdits(auth: Auth, self: Entry, labels: Label[]): Promise<Result<Entry>> {
    const rawEdits = await query<RawEntryEdit[]>`
        SELECT 
            entryEdits.id, 
            entryEdits.created, 
            entryEdits.createdTZOffset, 
            entryEdits.latitude, 
            entryEdits.longitude, 
            entryEdits.title, 
            entryEdits.entry, 
            entryEdits.label, 
            entryEdits.agentData
        FROM entryEdits, entries
        WHERE entries.id = ${self.id}
            AND entryEdits.entryId = entries.id
            AND entries.user = ${auth.id}
        ORDER BY entryEdits.created DESC
    `;

    const { err, val: edits } = await Result.collectAsync(
        rawEdits.map(e => Entry.Server.fromRawEdit(auth, labels, e))
    );

    if (err) return Result.err(err);

    self.edits = edits;

    return Result.ok(self);
}
