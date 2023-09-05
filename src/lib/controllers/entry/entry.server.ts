import { LIMITS } from '$lib/constants';
import { entryFromId } from '$lib/controllers/entry/getEntrySingle.server';
import * as getMulti from '$lib/controllers/entry/getEntryMulti.server';
import * as getSummary from '$lib/controllers/entry/getEntrySummaries.server';
import { query } from '$lib/db/mysql.server';
import { decrypt, encrypt } from '$lib/utils/encryption';
import { FileLogger } from '$lib/utils/log.server';
import { Result } from '$lib/utils/result';
import { wordCount } from '$lib/utils/text';
import { fmtUtc, nowUtc } from '$lib/utils/time';
import type { Hours, TimestampSecs } from '../../../types';
import type { Auth } from '../auth/auth.server';
import type { Label } from '../label/label';
import { UId } from '$lib/controllers/uuid/uuid.server';
import { Entry as _Entry, type EntryEdit, type RawEntryEdit, type Streaks } from './entry';

const logger = new FileLogger('Entry');

namespace EntryServer {
    type Entry = _Entry;

    export async function del(auth: Auth, id: string, restore: boolean): Promise<Result<null>> {
        const entries = await query<{ deleted: number | null }[]>`
            SELECT deleted
            FROM entries
            WHERE id = ${id}
              AND userId = ${auth.id}
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
                labelId = ${null},
                pinned = ${null}
            WHERE entries.id = ${id}
              AND userId = ${auth.id}
        `;

        return Result.ok(null);
    }

    export async function purgeAll(auth: Auth): Promise<void> {
        await query`
            DELETE FROM entryEdits WHERE userId = ${auth.id};
            DELETE FROM entries WHERE userId = ${auth.id};
        `;
    }

    export async function create(
        auth: Auth,
        labels: Label[],
        title: string,
        body: string,
        created: TimestampSecs,
        createdTzOffset: Hours,
        pinned: number | null,
        deleted: number | null,
        latitude: number | null,
        longitude: number | null,
        labelId: string | null,
        agentData: string,
        wordCount: number,
        edits: Omit<RawEntryEdit, 'id' | 'entryId'>[]
    ): Promise<Result<Entry>> {
        const numEntries = await query<{ count: number }[]>`
            SELECT COUNT(*) as count
            FROM entries
            WHERE userId = ${auth.id}
        `;
        if (numEntries[0].count >= LIMITS.entry.maxCount) {
            return Result.err(`Maximum number of entries (${LIMITS.entry.maxCount}) reached`);
        }

        if (labelId && !labels.find(l => l.id === labelId)) {
            await logger.error('Label not found', { labelId, username: auth.username });
            return Result.err('Label not found');
        }

        const id = await UId.Server.generate();

        await query`
            INSERT INTO entries
                (id, userId, title, body, created, createdTzOffset, deleted, pinned,
                 labelId, latitude, longitude, agentData, wordCount)
            VALUES (
                ${id},
                ${auth.id},
                ${encrypt(title, auth.key)},
                ${encrypt(body, auth.key)},
                ${created},
                ${createdTzOffset},
                ${deleted},
                ${pinned},
                ${labelId},
                ${latitude},
                ${longitude},
                ${encrypt(agentData || '', auth.key) || ''},
                ${wordCount}
            )
        `;

        const editsWithIds: (RawEntryEdit & { id: string })[] = [];

        for (const edit of edits) {
            const editId = await UId.Server.generate();

            editsWithIds.push({
                ...edit,
                id: editId,
                entryId: id
            });

            await query`
                INSERT INTO entryEdits
                    (id, userId, entryId, oldTitle, oldBody,
                     created, createdTzOffset, oldLabelId, latitude, longitude, agentData)
                VALUES (
                    ${editId},
                    ${auth.id},
                    ${id},
                    ${encrypt(edit.oldTitle, auth.key)},
                    ${encrypt(edit.oldBody, auth.key)},
                    ${edit.created},
                    ${edit.createdTzOffset ?? 0},
                    ${edit.oldLabelId ?? null},
                    ${edit.latitude ?? null},
                    ${edit.longitude ?? null},
                    ${encrypt(edit.agentData || '', auth.key) || ''}
                )
            `;
        }

        return Result.ok({
            id,
            title,
            body,
            created,
            createdTzOffset,
            deleted,
            pinned,
            latitude,
            longitude,
            label: labelId ? labels.find(l => l.id === labelId) || null : null,
            agentData,
            wordCount,
            edits: editsWithIds.map(edit => ({
                id: edit.id,
                entryId: id,
                created: edit.created,
                createdTzOffset: edit.createdTzOffset,
                latitude: edit.latitude,
                longitude: edit.longitude,
                agentData: edit.agentData,
                oldTitle: edit.oldTitle,
                oldBody: edit.oldBody,
                oldLabel: labelId ? labels.find(l => l.id === labelId) || null : null
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
              AND userId = ${auth.id}
        `;

        return Result.ok({
            ...self,
            pinned: newPinnedValue
        });
    }

    export async function edit(
        auth: Auth,
        entry: Entry,
        editTitle: string,
        editBody: string,
        editLatitude: number | null,
        editLongitude: number | null,
        editLabel: string,
        editTzOffset: number,
        editAgentData: string
    ): Promise<Result<null>> {
        const editId = await UId.Server.generate();

        await query`
            INSERT INTO entryEdits
                (id, userId, entryId, created, createdTzOffset, latitude, longitude,
                    oldTitle, oldBody, oldLabelId, agentData)
            VALUES (
                ${editId},
                ${auth.id},
                ${entry.id},
                ${nowUtc()},
                ${editTzOffset},
                ${editLatitude ?? null},
                ${editLongitude ?? null},
                ${encrypt(entry.title, auth.key)},
                ${encrypt(entry.body, auth.key)},
                ${entry.label?.id ?? null},
                ${encrypt(editAgentData || '', auth.key)}
            );

            UPDATE entries
            SET title     = ${encrypt(editTitle, auth.key)},
                body      = ${encrypt(editBody, auth.key)},
                labelId   = ${editLabel ?? null},
                wordCount = ${wordCount(editBody)}
            WHERE id = ${entry.id}
              AND userId = ${auth.id}
        `;

        return Result.ok(null);
    }

    export async function reassignAllLabels(
        auth: Auth,
        oldLabelId: string,
        newLabelId: string
    ): Promise<Result<null>> {
        await query`
            UPDATE entryEdits
            SET oldLabelId = ${newLabelId}
            WHERE userId = ${auth.id}
              AND oldLabelId = ${oldLabelId};

            UPDATE entries
            SET labelId = ${newLabelId}
            WHERE userId = ${auth.id}
              AND labelId = ${oldLabelId};
        `;
        return Result.ok(null);
    }

    export async function removeAllLabel(auth: Auth, labelId: string): Promise<Result<null>> {
        await query`
            UPDATE entryEdits
            SET oldLabelId = ${null}
            WHERE userId = ${auth.id}
              AND oldLabelId = ${labelId};

            UPDATE entries
            SET labelId = ${null}
            WHERE userId = ${auth.id}
              AND labelId = ${labelId}
        `;

        return Result.ok(null);
    }

    export async function getStreaks(auth: Auth, clientTzOffset: Hours): Promise<Result<Streaks>> {
        const entries = await query<{ created: number; createdTzOffset: number }[]>`
            SELECT created, createdTzOffset
            FROM entries
            WHERE deleted IS NULL
              AND userId = ${auth.id}
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
            entriesOnDay[fmtUtc(entry.created, entry.createdTzOffset, 'YYYY-MM-DD')] = true;
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
        const firstDay = fmtUtc(firstEntry.created, firstEntry.createdTzOffset, 'YYYY-MM-DD');

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

    export function editFromRaw(
        auth: Auth,
        labels: Record<string, Label>,
        rawEdit: RawEntryEdit
    ): Result<EntryEdit> {
        const { err: titleErr, val: oldTitle } = decrypt(rawEdit.oldTitle, auth.key);
        if (titleErr) return Result.err(titleErr);

        const { err: entryErr, val: oldBody } = decrypt(rawEdit.oldBody, auth.key);
        if (entryErr) return Result.err(entryErr);

        const { err: agentErr, val: agentData } = decrypt(rawEdit.agentData, auth.key);
        if (agentErr) return Result.err(agentErr);

        let oldLabel = null as Label | null;
        if (rawEdit.oldLabelId) {
            const label = labels[rawEdit.oldLabelId];
            if (!label) {
                void logger.error('Label not found', { rawEdit, labels });
                return Result.err('Label not found');
            }
            oldLabel = label;
        }

        return Result.ok({
            id: rawEdit.id,
            entryId: rawEdit.entryId,
            oldTitle,
            oldBody,
            oldLabel,
            created: rawEdit.created,
            createdTzOffset: rawEdit.createdTzOffset,
            latitude: rawEdit.latitude,
            longitude: rawEdit.longitude,
            agentData
        });
    }

    export const getFromId = entryFromId;
    export const all = getMulti.all;
    export const getPage = getMulti.getPage;
    export const near = getMulti.near;
    export const getSummariesNYearsAgo = getSummary.getSummariesNYearsAgo;
    export const getPinnedSummaries = getSummary.getPinnedSummaries;
    export const getPageOfSummaries = getSummary.getPageOfSummaries;
}

export const Entry = {
    ..._Entry,
    Server: EntryServer
};

export type Entry = _Entry;
