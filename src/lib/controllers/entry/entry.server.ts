import { query } from '$lib/db/mysql.server';
import { decrypt, encrypt } from '$lib/utils/encryption';
import { errorLogger } from '$lib/utils/log.server';
import { Result } from '$lib/utils/result';
import { wordCount } from '$lib/utils/text';
import { fmtUtc, nowUtc } from '$lib/utils/time';
import type { Auth } from '../auth/auth.server';
import { Label } from '../label/label';
import { Location } from '../location/location';
import { UUIdControllerServer } from '$lib/controllers/uuid/uuid.server';
import {
    Entry as _Entry,
    type EntryEdit,
    type EntryFilter,
    type RawEntry,
    type Streaks,
    type RawEntryEdit
} from './entry';

namespace EntryServer {
    type Entry = _Entry;
    const Entry = _Entry;

    export async function del(auth: Auth, id: string, restore: boolean): Promise<Result<null>> {
        const entries = await query<{ flags: number }[]>`
            SELECT flags
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

        const newFlags = Entry.Flags.setDeleted(entries[0].flags, !restore);

        await query`
            UPDATE entries
            SET flags = ${newFlags},
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

    export async function allRaw(
        auth: Auth,
        filter: Omit<EntryFilter, 'search'> = {}
    ): Promise<Result<RawEntry[]>> {
        let location: Location | undefined;
        if (filter.locationId) {
            const locationResult = await Location.fromId(query, auth, filter.locationId);
            if (locationResult.err) return Result.err(locationResult.err);
            location = locationResult.val;
        }
        const rawEntries = await query<RawEntry[]>`
            SELECT id,
                   created,
                   createdTZOffset,
                   title,
                   flags,
                   label,
                   entry,
                   latitude,
                   longitude,
                   agentData,
                   wordCount
            FROM entries
            WHERE ((flags & ${Entry.Flags.DELETED}) = ${
                filter.deleted ? Entry.Flags.DELETED : 0
            } OR ${filter.deleted === 'both'})
                  AND (label = ${filter.labelId || ''} OR ${filter.labelId === undefined})
              AND (${location === undefined} OR (
                    latitude IS NOT NULL
                    AND longitude IS NOT NULL
                    AND SQRT(
                                POW(latitude - ${location?.latitude || 0}, 2)
                                + POW(longitude - ${location?.longitude || 0}, 2)
                        ) <= ${(location?.radius || 0) * 2}
                ))
              AND user = ${auth.id}
            ORDER BY created DESC, id
        `;

        if (location) {
            return Result.ok(
                Location.filterByCirclePrecise(
                    rawEntries,
                    location.latitude,
                    location.longitude,
                    Location.degreesToMeters(location.radius)
                )
            );
        }
        return Result.ok(rawEntries);
    }

    export async function all(auth: Auth, filter: EntryFilter = {}): Promise<Result<Entry[]>> {
        const { err, val: rawEntries } = await allRaw(auth, filter);
        if (err) return Result.err(err);
        return fromRawMulti(auth, rawEntries);
    }

    export async function getPage(
        auth: Auth,
        offset: number,
        count: number,
        filters: EntryFilter = {}
    ): Promise<Result<[Entry[], number]>> {
        const { val: rawEntries, err: rawErr } = await allRaw(auth, filters);
        if (rawErr) return Result.err(rawErr);
        const { val, err } = await fromRawMulti(auth, rawEntries);
        if (err) return Result.err(err);
        let entries = val;

        if (filters.search) {
            entries = entries.filter(
                e =>
                    e.title.toLowerCase().includes(filters.search || '') ||
                    e.entry.toLowerCase().includes(filters.search || '')
            );
        }

        const start = offset;
        const end = start + count;

        return Result.ok([entries.slice(start, end), entries.length]);
    }

    export async function fromRaw(
        auth: Auth,
        rawEntry: RawEntry,
        labels: Label[]
    ): Promise<Result<Entry>> {
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
            flags: rawEntry.flags,
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

    export async function fromRawEdit(
        auth: Auth,
        labels: Label[],
        rawEdit: RawEntryEdit
    ): Promise<Result<EntryEdit>> {
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

        let entry: EntryEdit = {
            id: rawEdit.id,
            entryId: rawEdit.entryId,
            title: decryptedTitle,
            entry: decryptedEntry,
            created: rawEdit.created,
            createdTZOffset: rawEdit.createdTZOffset,
            latitude: rawEdit.latitude,
            longitude: rawEdit.longitude,
            agentData: decryptedAgent,
            label: null
        };

        if (rawEdit.label) {
            const label = labels.find(l => l.id === rawEdit.label);
            if (!label) {
                await errorLogger.error('Label not found', { rawEdit, labels });
                return Result.err('Label not found');
            }
            entry = { ...entry, label };
        }

        return Result.ok(entry);
    }

    /**
     * Returns a decrypted `Entry` with (optional) decrypted `Label`.
     */
    export async function fromId(
        auth: Auth,
        id: string,
        mustNotBeDeleted = true
    ): Promise<Result<Entry>> {
        const entries = await query<RawEntry[]>`
            SELECT label,
                   flags,
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
        if (mustNotBeDeleted && _Entry.isDeleted(entries[0])) {
            return Result.err('Entry is deleted');
        }

        const { val: labels, err: labelErr } = await Label.all(query, auth);
        if (labelErr) return Result.err(labelErr);

        return await fromRaw(auth, entries[0], labels);
    }

    export async function create(
        auth: Auth,
        labels: Label[],
        title: string,
        entry: string,
        created: TimestampSecs,
        createdTZOffset: Hours,
        flags: number,
        latitude: number | null,
        longitude: number | null,
        label: string | null,
        agentData: string | null,
        wordCount: number,
        edits: EntryEdit[]
    ): Promise<Result<Entry>> {
        const id = await UUIdControllerServer.generate();

        if (label) {
            if (!labels.find(l => l.id === label)) {
                await errorLogger.error('Label not found', { label, id, username: auth.username });
                return Result.err('Label not found');
            }
        }

        const encryptedTitle = encrypt(title, auth.key);
        const encryptedEntry = encrypt(entry, auth.key);
        const encryptedAgent = encrypt(agentData || '', auth.key);

        await query`
            INSERT INTO entries
                (id, user, title, entry, created, createdTZOffset, flags,
                 label, latitude, longitude, agentData, wordCount)
            VALUES (${id},
                    ${auth.id},
                    ${encryptedTitle},
                    ${encryptedEntry},
                    ${created},
                    ${createdTZOffset},
                    ${flags},
                    ${label ?? null},
                    ${latitude ?? null},
                    ${longitude ?? null},
                    ${encryptedAgent || ''},
                    ${wordCount})
        `;

        for (const edit of edits) {
            const encryptedEditTitle = encrypt(edit.title, auth.key);
            const encryptedEditEntry = encrypt(edit.entry, auth.key);
            const encryptedAgentData = encrypt(edit.agentData || '', auth.key);

            await query`
                INSERT INTO entryEdits
                    (id, entryId, title, entry,
                     created, createdTZOffset, label, latitude, longitude, agentData)
                VALUES (${edit.id},
                        ${id},
                        ${encryptedEditTitle},
                        ${encryptedEditEntry},
                        ${edit.created},
                        ${edit.createdTZOffset ?? 0},
                        ${edit.label?.id ?? null},
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
            flags,
            latitude,
            longitude,
            label: label ? labels.find(l => l.id === label) || null : null,
            agentData,
            wordCount,
            edits: edits.map(edit => ({
                ...edit,
                entryId: id,
                label: label ? labels.find(l => l.id === label) || null : null
            }))
        });
    }

    export async function removeLabel(auth: Auth, self: Entry): Promise<Result<Entry>> {
        if (!self.label) {
            return Result.err('Entry does not have a label to remove');
        }

        await query`
            UPDATE entries
            SET label = ${null}
            WHERE entries.id = ${self.id}
              AND user = ${auth.id}
        `;

        self.label = null;
        return Result.ok(self);
    }

    export async function setPinned(
        auth: Auth,
        self: Entry,
        pinned: boolean
    ): Promise<Result<Entry>> {
        if (_Entry.isPinned(self) === pinned) {
            return Result.ok(self);
        }

        const newFlags = _Entry.Flags.setPinned(self.flags, pinned);

        await query`
            UPDATE entries
            SET flags = ${newFlags}
            WHERE id = ${self.id}
              AND user = ${auth.id}
        `;

        return Result.ok({
            ...self,
            flags: newFlags
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

        const editId = await UUIdControllerServer.generate();

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
            SET title = ${encryptedNewTitle},
                entry = ${encryptedNewEntry},
                label = ${newLabel ?? null},
                wordCount = ${wordCount(newEntry)}
            WHERE id = ${entry.id}
              AND user = ${auth.id}
        `;

        return Result.ok(null);
    }

    export async function getTitles(auth: Auth): Promise<Result<Entry[]>> {
        const { val: entries, err } = await all(auth);
        if (err) return Result.err(err);
        return Result.ok(entries.map(Entry.entryToTitleEntry));
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
            WHERE (flags & ${_Entry.Flags.DELETED}) = 0
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

    export async function near(
        auth: Auth,
        location: Location,
        deleted: boolean | 'both' = false
    ): Promise<Result<Entry[]>> {
        const raw = await query<RawEntry[]>`
            SELECT id,
                   created,
                   createdTZOffset,
                   flags,
                   latitude,
                   longitude,
                   title,
                   entry,
                   label,
                   agentData,
                   wordCount
            FROM entries
            WHERE ((flags & ${_Entry.Flags.DELETED}) = ${deleted ? _Entry.Flags.DELETED : 0} OR ${
                deleted === 'both'
            })
            AND user = ${auth.id}
            AND latitude IS NOT NULL
            AND longitude IS NOT NULL
            AND SQRT(
                POW(latitude - ${location.latitude}, 2)
                + POW(longitude - ${location.longitude}, 2)
            ) <= ${location.radius}
        `;
        return await fromRawMulti(auth, raw);
    }

    async function fromRawMulti(auth: Auth, raw: RawEntry[]): Promise<Result<Entry[]>> {
        const rawEdits = await query<(RawEntry & { entryId: string })[]>`
            SELECT entryEdits.created,
                   entryEdits.entryId,
                   entryEdits.createdTZOffset,
                   entryEdits.latitude,
                   entryEdits.longitude,
                   entryEdits.title,
                   entryEdits.entry,
                   entryEdits.label,
                   entryEdits.agentData
            FROM entryEdits,
                 entries
            WHERE entries.user = ${auth.id}
              AND entries.id = entryEdits.entryId
        `;

        const { err, val: labels } = await Label.all(query, auth);
        if (err) return Result.err(err);

        const { err: editsErr, val: edits } = await Result.collectAsync(
            rawEdits.map(async e => await fromRawEdit(auth, labels, e))
        );
        if (editsErr) return Result.err(editsErr);

        const groupedEdits = edits.reduce<Record<string, EntryEdit[]>>((prev, edit) => {
            if (!edit.entryId) return prev;
            prev[edit.entryId] ??= [];
            prev[edit.entryId].push(edit);
            return prev;
        }, {});

        const groupedLabels = labels.reduce<Record<string, Label>>((prev, label) => {
            prev[label.id] = label;
            return prev;
        }, {});

        return Result.collect(
            raw.map(rawEntry => {
                const { err: titleErr, val: decryptedTitle } = decrypt(rawEntry.title, auth.key);
                if (titleErr) return Result.err(titleErr);

                const { err: entryErr, val: decryptedEntry } = decrypt(rawEntry.entry, auth.key);
                if (entryErr) return Result.err(entryErr);

                let decryptedAgentData = '';
                if (rawEntry.agentData) {
                    const { err: agentErr, val } = decrypt(rawEntry.agentData, auth.key);
                    if (agentErr) return Result.err(agentErr);
                    decryptedAgentData = val;
                }

                return Result.ok({
                    id: rawEntry.id,
                    title: decryptedTitle,
                    entry: decryptedEntry,
                    created: rawEntry.created,
                    createdTZOffset: rawEntry.createdTZOffset,
                    flags: rawEntry.flags,
                    latitude: rawEntry.latitude,
                    longitude: rawEntry.longitude,
                    agentData: decryptedAgentData,
                    wordCount: rawEntry.wordCount,
                    label: rawEntry.label ? groupedLabels[rawEntry.label] : null,
                    edits: groupedEdits[rawEntry.id]
                });
            })
        );
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
            rawEdits.map(e => fromRawEdit(auth, labels, e))
        );

        if (err) return Result.err(err);

        self.edits = edits;

        return Result.ok(self);
    }
}

export const Entry = {
    ..._Entry,
    Server: EntryServer
};

export type Entry = _Entry;
