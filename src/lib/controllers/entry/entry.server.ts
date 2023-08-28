import { MAXIMUM_ENTITIES } from '$lib/constants';
import { entryFromId } from '$lib/controllers/entry/getEntrySingle.server';
import {
    all as _all,
    getTitles as _getTitles,
    getPage as _getPage,
    near as _near,
    getTitlesNYearsAgo as _getTitlesNYearsAgo,
    getTitlesPinned as _getTitlesPinned
} from '$lib/controllers/entry/getEntryMulti.server';
import { query } from '$lib/db/mysql.server';
import { decrypt, encrypt } from '$lib/utils/encryption';
import { errorLogger } from '$lib/utils/log.server';
import { Result } from '$lib/utils/result';
import { wordCount } from '$lib/utils/text';
import { fmtUtc, nowUtc } from '$lib/utils/time';
import type { Auth } from '../auth/auth.server';
import type { Label } from '../label/label';
import { UId } from '$lib/controllers/uuid/uuid.server';
import { Entry as _Entry, type EntryEdit, type RawEntryEdit, type Streaks } from './entry';

namespace EntryServer {
    type Entry = _Entry;

    export async function del(auth: Auth, id: string, restore: boolean): Promise<Result<null>> {
        const entries = await query<{ deleted: number | null }[]>`
            SELECT deleted
            FROM entries
            WHERE id = ${id}
              AND user = ${auth.id}
        `;
        if (!entries.length) {
            return Result.err('Entry not found');
        }
        if (Entry.isDeleted(entries[0]) === !restore) {
            return Result.err(restore ? 'Entry is not deleted' : 'Entry already deleted');
        }

        await query`
            UPDATE entries
            SET deleted = ${restore ? null : nowUtc()},
                label = ${null}
            WHERE entries.id = ${id}
              AND user = ${auth.id}
        `;

        return Result.ok(null);
    }

    export async function purgeAll(auth: Auth): Promise<void> {
        await query`
            DELETE
            FROM entryEdits
            WHERE entry IN (SELECT id
                            FROM entries
                            WHERE user = ${auth.id})
        `;
        await query`
            DELETE
            FROM entries
            WHERE user = ${auth.id}
        `;
    }

    export async function create(
        auth: Auth,
        labels: Label[],
        title: string,
        entry: string,
        created: TimestampSecs,
        createdTZOffset: Hours,
        pinned: number | null,
        deleted: number | null,
        latitude: number | null,
        longitude: number | null,
        label: string | null,
        agentData: string | null,
        wordCount: number,
        edits: (Omit<EntryEdit, 'id' | 'entryId' | 'label'> & { label?: string })[]
    ): Promise<Result<Entry>> {
        const numEntries = await query<{ count: number }[]>`
            SELECT COUNT(*) as count
            FROM entries
            WHERE user = ${auth.id}
        `;
        if (numEntries[0].count >= MAXIMUM_ENTITIES.entry) {
            return Result.err(`Maximum number of entries (${MAXIMUM_ENTITIES.entry}) reached`);
        }

        if (label && !labels.find(l => l.id === label)) {
            await errorLogger.error('Label not found', { label, username: auth.username });
            return Result.err('Label not found');
        }

        const encryptedTitle = encrypt(title, auth.key);
        const encryptedEntry = encrypt(entry, auth.key);
        const encryptedAgent = encrypt(agentData || '', auth.key);
        const id = await UId.Server.generate();

        await query`
            INSERT INTO entries
                (id, user, title, entry, created, createdTZOffset, deleted, pinned,
                 label, latitude, longitude, agentData, wordCount)
            VALUES (${id},
                    ${auth.id},
                    ${encryptedTitle},
                    ${encryptedEntry},
                    ${created},
                    ${createdTZOffset},
                    ${deleted ?? null},
                    ${pinned ?? null},
                    ${label ?? null},
                    ${latitude ?? null},
                    ${longitude ?? null},
                    ${encryptedAgent || ''},
                    ${wordCount})
        `;

        const editsWithIds: (Omit<EntryEdit, 'label'> & { label?: string })[] = [];

        for (const edit of edits) {
            const encryptedEditTitle = encrypt(edit.title, auth.key);
            const encryptedEditEntry = encrypt(edit.entry, auth.key);
            const encryptedAgentData = encrypt(edit.agentData || '', auth.key);

            const editId = await UId.Server.generate();

            editsWithIds.push({
                ...edit,
                id: editId,
                entryId: id
            });

            await query`
                INSERT INTO entryEdits
                    (id, entryId, title, entry,
                     created, createdTZOffset, label, latitude, longitude, agentData)
                VALUES (${editId},
                        ${id},
                        ${encryptedEditTitle},
                        ${encryptedEditEntry},
                        ${edit.created},
                        ${edit.createdTZOffset ?? 0},
                        ${edit.label ?? null},
                        ${edit.latitude ?? null},
                        ${edit.longitude ?? null},
                        ${encryptedAgentData || ''})
            `;
        }

        return Result.ok({
            id,
            title,
            entry,
            created,
            createdTZOffset,
            deleted,
            pinned,
            latitude,
            longitude,
            label: label ? labels.find(l => l.id === label) || null : null,
            agentData,
            wordCount,
            edits: editsWithIds.map(edit => ({
                ...edit,
                entryId: id,
                label: label ? labels.find(l => l.id === label) || null : null
            }))
        });
    }

    export async function setPinned(
        auth: Auth,
        self: Entry,
        pinned: boolean
    ): Promise<Result<Entry>> {
        if (Entry.isPinned(self) === pinned) {
            return Result.ok(self);
        }

        const newPinnedValue = pinned ? nowUtc() : null;

        await query`
            UPDATE entries
            SET pinned = ${newPinnedValue}
            WHERE id = ${self.id}
              AND user = ${auth.id}
        `;

        return Result.ok({
            ...self,
            pinned: newPinnedValue
        });
    }

    export async function edit(
        auth: Auth,
        entry: Entry,
        newTitle: string,
        newEntry: string,
        newLatitude: number | undefined,
        newLongitude: number | undefined,
        newLabel: string,
        tzOffset: number,
        agentData: string
    ): Promise<Result<null>> {
        const encryptedNewTitle = encrypt(newTitle, auth.key);
        const encryptedNewEntry = encrypt(newEntry, auth.key);
        const encryptedEditAgentData = encrypt(agentData, auth.key);
        const encryptedOldTitle = encrypt(entry.title, auth.key);
        const encryptedOldEntry = encrypt(entry.entry, auth.key);

        const editId = await UId.Server.generate();

        await query`
            INSERT INTO entryEdits
            (id, entryId, created, createdTZOffset, latitude, longitude, title, entry,
             label, agentData)
            VALUES (${editId},
                    ${entry.id},
                    ${nowUtc()},
                    ${tzOffset},
                    ${newLatitude ?? null},
                    ${newLongitude ?? null},
                    ${encryptedOldTitle},
                    ${encryptedOldEntry},
                    ${entry.label?.id ?? null},
                    ${encryptedEditAgentData || ''})
        `;

        await query`
            UPDATE entries
            SET title     = ${encryptedNewTitle},
                entry     = ${encryptedNewEntry},
                label     = ${newLabel ?? null},
                wordCount = ${wordCount(newEntry)}
            WHERE id = ${entry.id}
              AND user = ${auth.id}
        `;

        return Result.ok(null);
    }

    export async function reassignAllLabels(
        auth: Auth,
        oldLabel: string,
        newLabel: string
    ): Promise<Result<null>> {
        await query`
            UPDATE entryEdits
            SET label = ${newLabel}
            WHERE entryId IN (SELECT id
                              FROM entries
                              WHERE user = ${auth.id})
              AND label = ${oldLabel}
        `;

        await query`
            UPDATE entries
            SET label = ${newLabel}
            WHERE user = ${auth.id}
              AND label = ${oldLabel}
        `;

        return Result.ok(null);
    }

    export async function removeAllLabel(auth: Auth, labelId: string): Promise<Result<null>> {
        await query`
            UPDATE entryEdits
            SET label = ${null}
            WHERE entryId IN (SELECT id
                              FROM entries
                              WHERE user = ${auth.id})
              AND label = ${labelId}
        `;

        await query`
            UPDATE entries
            SET label = ${null}
            WHERE user = ${auth.id}
              AND label = ${labelId}
        `;

        return Result.ok(null);
    }

    export async function getStreaks(auth: Auth, clientTzOffset: Hours): Promise<Result<Streaks>> {
        const entries = await query<{ created: number; createdTZOffset: number }[]>`
            SELECT created, createdTZOffset
            FROM entries
            WHERE deleted IS NULL
              AND user = ${auth.id}
            ORDER BY created DESC, id
        `;

        if (entries.length < 1) {
            return Result.ok({
                current: 0,
                longest: 0,
                runningOut: false
            });
        }

        const today = fmtUtc(nowUtc(), clientTzOffset, 'YYYY-MM-DD');
        const yesterday = fmtUtc(nowUtc() - 86400, clientTzOffset, 'YYYY-MM-DD');

        let current = 0;

        // group entries by day
        const entriesOnDay: Record<string, true | undefined> = {};
        for (const entry of entries) {
            entriesOnDay[fmtUtc(entry.created, entry.createdTZOffset, 'YYYY-MM-DD')] = true;
        }

        // streaks are running out when we made an entry yesterday but not today
        const runningOut = !entriesOnDay[today] && !!entriesOnDay[yesterday];

        let currentDay = today;
        if (!entriesOnDay[currentDay]) {
            currentDay = yesterday;
        }
        // find the current streak by counting backwards from today until
        // we find a day without an entry
        while (entriesOnDay[currentDay]) {
            current++;
            currentDay = fmtUtc(new Date(currentDay).getTime() / 1000 - 86400, 0, 'YYYY-MM-DD');
        }

        let longest = current;
        let currentStreak = 0;

        const firstEntry = entries[entries.length - 1];
        const firstDay = fmtUtc(firstEntry.created, firstEntry.createdTZOffset, 'YYYY-MM-DD');

        currentDay = today;
        // find the longest streak by counting forwards from first entry
        // until we find a day without an entry
        while (currentDay !== firstDay) {
            currentDay = fmtUtc(new Date(currentDay).getTime() / 1000 - 86400, 0, 'YYYY-MM-DD');
            if (entriesOnDay[currentDay]) {
                currentStreak++;
                if (currentStreak > longest) {
                    longest = currentStreak;
                }
            } else {
                currentStreak = 0;
            }
        }

        return Result.ok({
            current,
            longest,
            runningOut
        });
    }

    export function fromRawEdit(
        auth: Auth,
        labels: Label[],
        rawEdit: RawEntryEdit
    ): Result<EntryEdit> {
        const { err: titleErr, val: decryptedTitle } = decrypt(rawEdit.title, auth.key);
        if (titleErr) return Result.err(titleErr);

        const { err: entryErr, val: decryptedEntry } = decrypt(rawEdit.entry, auth.key);
        if (entryErr) return Result.err(entryErr);

        let decryptedAgent = '';
        if (rawEdit.agentData) {
            const { err: agentErr, val } = decrypt(rawEdit.agentData, auth.key);
            if (agentErr) return Result.err(agentErr);
            decryptedAgent = val;
        }

        const edit: EntryEdit = {
            id: rawEdit.id,
            entryId: rawEdit.entryId,
            title: decryptedTitle,
            entry: decryptedEntry,
            created: rawEdit.created,
            createdTZOffset: rawEdit.createdTZOffset,
            latitude: rawEdit.latitude,
            longitude: rawEdit.longitude,
            agentData: decryptedAgent,
            label: labels.find(l => l.id === rawEdit.label) ?? null
        };

        if (rawEdit.label && !edit.label) {
            void errorLogger.error('Label not found', { rawEdit, labels });
            return Result.err('Label not found');
        }

        return Result.ok(edit);
    }

    export const getFromId = entryFromId;
    export const getTitles = _getTitles;
    export const all = _all;
    export const getPage = _getPage;
    export const near = _near;
    export const getTitlesNYearsAgo = _getTitlesNYearsAgo;
    export const getTitlesPinned = _getTitlesPinned;
}

export const Entry = {
    ..._Entry,
    Server: EntryServer
};

export type Entry = _Entry;
