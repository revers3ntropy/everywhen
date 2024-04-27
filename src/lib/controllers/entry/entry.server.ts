import { LIMITS } from '$lib/constants';
import { entryFromId } from '$lib/controllers/entry/getEntrySingle.server';
import * as getMulti from '$lib/controllers/entry/getEntryMulti.server';
import * as getSummary from '$lib/controllers/entry/getEntrySummaries.server';
import { query } from '$lib/db/mysql.server';
import { Day } from '$lib/utils/day';
import { decrypt, encrypt } from '$lib/utils/encryption';
import { FileLogger } from '$lib/utils/log.server';
import { Result } from '$lib/utils/result';
import { wordCount, wordsFromText } from '$lib/utils/text';
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
              AND userId = ${auth.id};

            UPDATE wordsInEntries
            SET entryIsDeleted = ${restore ? 0 : 1}
            WHERE entryId = ${id}
                AND userId = ${auth.id}
        `;

        return Result.ok(null);
    }

    export async function purgeAll(auth: Auth): Promise<void> {
        await query`
            DELETE FROM entryEdits     WHERE userId = ${auth.id};
            DELETE FROM entries        WHERE userId = ${auth.id};
            DELETE FROM wordsInEntries WHERE userId = ${auth.id};
        `;
    }

    export async function updateWordIndex(
        auth: Auth,
        body: string,
        title: string,
        entryId: string,
        entryIsDeleted: boolean,
        shouldClear: boolean
    ): Promise<void> {
        if (shouldClear) {
            await query`
                DELETE FROM wordsInEntries
                WHERE entryId = ${entryId}
                AND userId = ${auth.id}
            `;
        }

        const titleWords = wordsFromText(title);
        const bodyWords = wordsFromText(body);

        const countMap: Record<string, number> = {};

        for (const word of titleWords) {
            // searchable, but does not count towards word count
            countMap[word] = 0;
        }

        for (const word of bodyWords) {
            countMap[word] ??= 0;
            countMap[word] += 1;
        }

        await Result.collectAsync(
            Object.entries(countMap).map(async ([word, count]) =>
                Result.ok(
                    await query`
                        INSERT INTO wordsInEntries
                            (userId, entryId, word, count, entryIsDeleted)
                        VALUES (
                            ${auth.id},
                            ${entryId},
                            ${encrypt(word, auth.key)},
                            ${count},
                            ${entryIsDeleted}
                        )
                    `
                )
            )
        );
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

        const id = await UId.generate();

        await updateWordIndex(auth, body, title, id, !!deleted, false);

        console.log('created entry on', Day.fromTimestamp(created, createdTzOffset));

        await query`
            INSERT INTO entries
                (id, userId, title, body, created, createdTzOffset, day, deleted, pinned,
                 labelId, latitude, longitude, agentData, wordCount)
            VALUES (
                ${id},
                ${auth.id},
                ${encrypt(title, auth.key)},
                ${encrypt(body, auth.key)},
                ${created},
                ${createdTzOffset},
                ${Day.fromTimestamp(created, createdTzOffset).fmtIso()},
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
            const editId = await UId.generate();

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
            label: labels.find(l => l.id === labelId) ?? null,
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
                oldLabel: labels.find(l => l.id === labelId) ?? null
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
        editLabel: string | null,
        editTzOffset: number,
        editAgentData: string
    ): Promise<void> {
        const editId = await UId.generate();

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
                labelId   = ${editLabel},
                wordCount = ${wordCount(editBody)}
            WHERE id = ${entry.id}
              AND userId = ${auth.id}
        `;

        // assumes you cannot edit a deleted entry
        await updateWordIndex(auth, editBody, editTitle, entry.id, false, true);
    }

    export async function reassignAllLabels(
        auth: Auth,
        oldLabelId: string,
        newLabelId: string
    ): Promise<void> {
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
    }

    export async function removeAllLabel(auth: Auth, labelId: string): Promise<void> {
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
        const oldTitleRes = decrypt(rawEdit.oldTitle, auth.key);
        if (!oldTitleRes.ok) return oldTitleRes.cast();

        const oldBodyRes = decrypt(rawEdit.oldBody, auth.key);
        if (!oldBodyRes.ok) return oldBodyRes.cast();

        const agentDataRes = decrypt(rawEdit.agentData, auth.key);
        if (!agentDataRes.ok) return agentDataRes.cast();

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
            oldTitle: oldTitleRes.val,
            oldBody: oldBodyRes.val,
            oldLabel,
            created: rawEdit.created,
            createdTzOffset: rawEdit.createdTzOffset,
            latitude: rawEdit.latitude,
            longitude: rawEdit.longitude,
            agentData: agentDataRes.val
        });
    }
    export async function allBasicSummaries(auth: Auth): Promise<
        {
            created: number;
            createdTzOffset: number;
            wordCount: number;
            agentData: string;
        }[]
    > {
        return await query<
            {
                created: number;
                createdTzOffset: number;
                wordCount: number;
                agentData: string;
            }[]
        >`
            SELECT
                created,
                createdTzOffset,
                wordCount,
                agentData
            FROM entries
            WHERE userId = ${auth.id}
              AND deleted IS NULL
            ORDER BY created DESC, id
        `;
    }

    export async function basicSummariesForEntriesWithWord(
        auth: Auth,
        encryptedWord: string
    ): Promise<
        {
            created: number;
            createdTzOffset: number;
            wordCount: number;
            agentData: string;
        }[]
    > {
        return await query<
            {
                created: number;
                createdTzOffset: number;
                wordCount: number;
                agentData: string;
            }[]
        >`
            SELECT
                entries.created,
                entries.createdTzOffset,
                entries.agentData,
                wordsInEntries.count as wordCount
            FROM entries, wordsInEntries
            WHERE entries.deleted IS NULL
                AND entries.userId = ${auth.id}
                AND wordsInEntries.word = ${encryptedWord}
                AND wordsInEntries.entryId = entries.id
            ORDER BY entries.created DESC, entries.id
        `;
    }

    export async function wordFrequencies(auth: Auth): Promise<[string, number][]> {
        return await query<{ word: string; count: number }[]>`
            SELECT word, count
            FROM wordsInEntries
            WHERE userId = ${auth.id}
            AND count > 0
            AND entryIsDeleted = 0
        `
            .then(words =>
                words.reduce(
                    (map, { word, count }) => {
                        map[word] ??= 0;
                        map[word] += count;
                        return map;
                    },
                    {} as Record<string, number>
                )
            )
            .then(wordsMap =>
                Object.entries(wordsMap)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 100)
            );
    }

    export async function counts(auth: Auth): Promise<{ wordCount: number; entryCount: number }> {
        return await query<{ wordCount: number; entryCount: number }[]>`
            SELECT SUM(wordCount) as wordCount, COUNT(*) as entryCount
            FROM entries
            WHERE userId = ${auth.id}
            AND deleted IS NULL
        `.then(([res]) => res);
    }

    export async function earliestEntryCreation(
        auth: Auth
    ): Promise<{ created: number; createdTzOffset: number } | null> {
        return await query<{ created: number; createdTzOffset: number }[]>`
            SELECT created, createdTzOffset
            FROM entries
            WHERE userId = ${auth.id}
            AND deleted IS NULL
            ORDER BY created ASC
            LIMIT 1
        `.then(res => res[0] ?? null);
    }

    export async function wordCountForEncryptedWord(auth: Auth, word: string): Promise<number> {
        return await query<{ wordInstances: number }[]>`
            SELECT SUM(count) as wordInstances
            FROM wordsInEntries
            WHERE userId = ${auth.id}
            AND word = ${word}
            AND count > 0
            AND entryIsDeleted = 0
        `.then(([res]) => res.wordInstances ?? 0);
    }

    export async function updateEncryptedFields(
        userId: string,
        oldDecrypt: (a: string) => Result<string>,
        newEncrypt: (a: string) => string
    ): Promise<Result<null[], string>> {
        const entries = await query<
            {
                id: string;
                title: string;
                body: string;
                agentData: string;
            }[]
        >`
            SELECT id, title, body, agentData
            FROM entries
            WHERE userId = ${userId}
        `;

        const entryRes = await Result.collectAsync(
            entries.map(async (event): Promise<Result<null>> => {
                const titleRes = oldDecrypt(event.title);
                if (!titleRes.ok) return titleRes.cast();
                const bodyRes = oldDecrypt(event.body);
                if (!bodyRes.ok) return bodyRes.cast();
                const agentDataRes = oldDecrypt(event.agentData);
                if (!agentDataRes.ok) return agentDataRes.cast();

                await query`
                    UPDATE entries
                    SET title = ${newEncrypt(titleRes.val)},
                        body  = ${newEncrypt(bodyRes.val)},
                        agentData = ${newEncrypt(agentDataRes.val)}
                    WHERE id = ${event.id}
                      AND userId = ${userId}
                `;
                return Result.ok(null);
            })
        );
        if (!entryRes.ok) return entryRes.cast();

        const edits = await query<
            {
                id: string;
                oldTitle: string;
                oldBody: string;
                agentData: string;
            }[]
        >`
            SELECT id, oldTitle, oldBody, agentData
            FROM entryEdits
            WHERE userId = ${userId}
        `;

        const editRes = await Result.collectAsync(
            edits.map(async (edit): Promise<Result<null>> => {
                const titleRes = oldDecrypt(edit.oldTitle);
                if (!titleRes.ok) return titleRes.cast();
                const bodyRes = oldDecrypt(edit.oldBody);
                if (!bodyRes.ok) return bodyRes.cast();
                const agentDataRes = oldDecrypt(edit.agentData);
                if (!agentDataRes.ok) return agentDataRes.cast();

                await query`
                    UPDATE entryEdits
                    SET oldTitle = ${newEncrypt(titleRes.val)},
                        oldBody  = ${newEncrypt(bodyRes.val)},
                        agentData = ${newEncrypt(agentDataRes.val)}
                    WHERE id = ${edit.id}
                      AND userId = ${userId}
                `;
                return Result.ok(null);
            })
        );
        if (!editRes.ok) return editRes.cast();

        const words = await query<
            {
                entryId: string;
                word: string;
            }[]
        >`
            SELECT entryId, word
            FROM wordsInEntries
            WHERE userId = ${userId}
        `;
        return await Result.collectAsync(
            words.map(async (wordData): Promise<Result<null>> => {
                const wordRes = oldDecrypt(wordData.word);
                if (!wordRes.ok) return wordRes.cast();

                await query`
                    UPDATE wordsInEntries
                    SET word = ${newEncrypt(wordRes.val)}
                    WHERE entryId = ${wordData.entryId}
                        AND word = ${wordData.word}
                        AND userId = ${userId}
                `;
                return Result.ok(null);
            })
        );
    }

    export async function getEntryCountPerDay(auth: Auth): Promise<Record<string, number>> {
        return Object.fromEntries(
            (
                await query<{ day: string; count: number }[]>`
                    SELECT day, COUNT(*) as count
                    FROM entries
                    WHERE userId = ${auth.id}
                    GROUP BY day
                `
            ).map(({ day, count }) => [day, count])
        );
    }

    export const getFromId = entryFromId;
    export const all = getMulti.all;
    export const getPage = getMulti.getPage;
    export const onDay = getMulti.onDay;
    export const getSummariesNYearsAgo = getSummary.getSummariesNYearsAgo;
    export const getPinnedSummaries = getSummary.getPinnedSummaries;
    export const getPageOfSummaries = getSummary.getPageOfSummaries;
}

export const Entry = {
    ..._Entry,
    ...EntryServer
};

export type Entry = _Entry;
