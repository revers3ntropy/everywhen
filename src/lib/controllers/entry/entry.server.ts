import type { QueryFunc } from '$lib/db/mysql.server';
import { decrypt, encrypt, encryptMulti } from '$lib/security/encryption.server';
import { Result } from '$lib/utils/result';
import { fmtUtc, nowUtc } from '$lib/utils/time';
import { Label } from '../label/label';
import { Location } from '../location/location';
import type { Auth } from '../user/user';
import { UUId } from '../uuid/uuid';
import {
    Entry as _Entry,
    type EntryEdit,
    type EntryFilter,
    type RawEntry,
    type Streaks
} from './entry';
export type Entry = _Entry;

namespace EntryUtils {
    export async function del(
        query: QueryFunc,
        auth: Auth,
        id: string,
        restore: boolean
    ): Promise<Result> {
        const entries = await query<{ flags: number }[]>`
            SELECT flags
            FROM entries
            WHERE id = ${id}
              AND user = ${auth.id}
        `;
        if (!entries.length) {
            return Result.err('Entry not found');
        }
        if (_Entry.isDeleted(entries[0]) === !restore) {
            return Result.err(restore ? 'Entry is not deleted' : 'Entry already deleted');
        }

        const newFlags = _Entry.Flags.setDeleted(entries[0].flags, !restore);

        await query`
            UPDATE entries
            SET flags = ${newFlags},
                label = ${null}
            WHERE entries.id = ${id}
              AND user = ${auth.id}
        `;

        return Result.ok(null);
    }

    export async function purgeAll(query: QueryFunc, auth: Auth): Promise<void> {
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
        query: QueryFunc,
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
                   agentData
            FROM entries
            WHERE ((flags & ${_Entry.Flags.DELETED}) = ${
                filter.deleted ? _Entry.Flags.DELETED : 0
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

    export async function all(
        query: QueryFunc,
        auth: Auth,
        filter: EntryFilter = {}
    ): Promise<Result<Entry[]>> {
        const { err, val: rawEntries } = await Entry.allRaw(query, auth, filter);
        if (err) return Result.err(err);
        return fromRawMulti(query, auth, rawEntries);
    }

    export async function getPage(
        query: QueryFunc,
        auth: Auth,
        offset: number,
        count: number,
        filters: EntryFilter = {}
    ): Promise<Result<[Entry[], number]>> {
        const { val: rawEntries, err: rawErr } = await Entry.allRaw(query, auth, filters);
        if (rawErr) return Result.err(rawErr);
        const { val, err } = await fromRawMulti(query, auth, rawEntries);
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
        query: QueryFunc,
        auth: Auth,
        rawEntry: RawEntry,
        isEdit = false
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
            agentData: decryptedAgent
        };

        if (rawEntry.label) {
            const { err, val } = await addLabel(query, auth, entry, rawEntry.label);
            if (err) return Result.err(err);
            entry = val;
        }

        if (!isEdit) {
            const { err, val } = await addEdits(query, auth, entry);
            if (err) return Result.err(err);
            entry = val;
        }

        return Result.ok(entry);
    }

    /**
     * Returns a decrypted `Entry` with (optional) decrypted `Label`.
     */
    export async function fromId(
        query: QueryFunc,
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
                   agentData
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

        return await fromRaw(query, auth, entries[0]);
    }

    export async function create(
        query: QueryFunc,
        auth: Auth,
        json_: PickOptionalAndMutable<RawEntry, 'id' | 'flags' | 'created'>
    ): Promise<Result<Entry>> {
        const json: typeof json_ & { id: string } = {
            ...json_,
            id: await UUId.generateUniqueUUId(query)
        };
        json.created ??= nowUtc();

        const entry: Entry = {
            id: json.id,
            title: json.title,
            entry: json.entry,
            created: json.created,
            createdTZOffset: json.createdTZOffset,
            flags: json.flags || _Entry.Flags.NONE,
            latitude: json.latitude,
            longitude: json.longitude,
            agentData: json.agentData
        };

        entry.edits = await Promise.all(
            json.edits?.map(
                async (e): Promise<Entry> => ({
                    id: await UUId.generateUniqueUUId(query),
                    title: e.title,
                    entry: e.entry,
                    created: e.created,
                    createdTZOffset: e.createdTZOffset,
                    flags: _Entry.Flags.NONE,
                    latitude: e.latitude,
                    longitude: e.longitude,
                    agentData: e.agentData
                })
            ) ?? []
        );

        if (json.label) {
            const { err } = await addLabel(query, auth, entry, json.label);
            if (err) return Result.err(err);
        }

        const { err: titleErr, val: encryptedTitle } = encrypt(entry.title, auth.key);
        if (titleErr) return Result.err(titleErr);

        const { err: entryErr, val: encryptedEntry } = encrypt(entry.entry, auth.key);
        if (entryErr) return Result.err(entryErr);

        const { err: agentErr, val: encryptedAgent } = encrypt(entry.agentData || '', auth.key);
        if (agentErr) return Result.err(agentErr);

        await query`
            INSERT INTO entries
            (id, user, title, entry, created, createdTZOffset, flags,
             label, latitude, longitude, agentData)
            VALUES (${entry.id},
                    ${auth.id},
                    ${encryptedTitle},
                    ${encryptedEntry},
                    ${entry.created},
                    ${entry.createdTZOffset ?? 0},
                    ${entry.flags},
                    ${entry.label?.id ?? null},
                    ${entry.latitude ?? null},
                    ${entry.longitude ?? null},
                    ${encryptedAgent || ''})
        `;

        for (const edit of entry.edits) {
            const { err: editTitleErr, val: encryptedEditTitle } = encrypt(edit.title, auth.key);
            if (editTitleErr) return Result.err(editTitleErr);

            const { err: editEntryErr, val: encryptedEditEntry } = encrypt(edit.entry, auth.key);
            if (editEntryErr) return Result.err(editEntryErr);

            const { err: editAgentErr, val: encryptedAgentData } = encrypt(
                edit.agentData || '',
                auth.key
            );
            if (editAgentErr) return Result.err(editAgentErr);

            await query`
                INSERT INTO entryEdits
                (id, entryId, title, entry,
                 created, createdTZOffset, label, latitude, longitude, agentData)
                VALUES (${edit.id},
                        ${entry.id},
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

        return Result.ok(entry);
    }

    export async function removeLabel(
        query: QueryFunc,
        auth: Auth,
        self: Entry
    ): Promise<Result<Entry>> {
        if (!self.label) {
            return Result.err('Entry does not have a label to remove');
        }

        await query`
            UPDATE entries
            SET label = ${null}
            WHERE entries.id = ${self.id}
              AND user = ${auth.id}
        `;

        self.label = undefined;
        return Result.ok(self);
    }

    export async function updateLabel(
        query: QueryFunc,
        auth: Auth,
        self: Entry,
        label: string | null
    ): Promise<Result<Entry>> {
        if (label == null) {
            return Entry.removeLabel(query, auth, self);
        }

        if (self.label?.id === label) {
            return Result.err('Entry already has that label');
        }

        await query`
            UPDATE entries
            SET label = ${label}
            WHERE id = ${self.id}
              AND user = ${auth.id}
        `;

        return await addLabel(query, auth, self, label);
    }

    export async function setPinned(
        query: QueryFunc,
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
        query: QueryFunc,
        auth: Auth,
        entry: Entry,
        newTitle: string,
        newEntry: string,
        newLatitude: number | undefined,
        newLongitude: number | undefined,
        newLabel: string,
        tzOffset: number,
        agentData: string
    ): Promise<Result> {
        const { err, val: encryptionResults } = encryptMulti(
            auth.key,
            newTitle,
            newEntry,
            agentData,
            entry.title,
            entry.entry
        );
        if (err) return Result.err(err);
        const [encryptedNewTitle, encryptedNewEntry, encryptedEditAgentData, oldTitle, oldEntry] =
            encryptionResults;

        const editId = await UUId.generateUniqueUUId(query);

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
                    ${oldTitle},
                    ${oldEntry},
                    ${entry.label?.id ?? null},
                    ${encryptedEditAgentData || ''})
        `;

        await query`
            UPDATE entries
            SET title = ${encryptedNewTitle},
                entry = ${encryptedNewEntry},
                label = ${newLabel ?? null}
            WHERE id = ${entry.id}
              AND user = ${auth.id}
        `;

        return Result.ok(null);
    }

    export async function getTitles(query: QueryFunc, auth: Auth): Promise<Result<Entry[]>> {
        const { val: entries, err } = await Entry.all(query, auth);
        if (err) return Result.err(err);

        return Result.ok(entries.map(_Entry.entryToTitleEntry));
    }

    export async function reassignAllLabels(
        query: QueryFunc,
        auth: Auth,
        oldLabel: string,
        newLabel: string
    ): Promise<Result> {
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

    export async function removeAllLabel(
        query: QueryFunc,
        auth: Auth,
        labelId: string
    ): Promise<Result> {
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

    export async function getStreaks(query: QueryFunc, auth: Auth, clientTzOffset: Hours): Promise<Result<Streaks>> {
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
        query: QueryFunc,
        auth: Auth,
        location: Location,
        deleted: boolean | 'both' = false
    ): Promise<Result<Entry[]>> {
        return await fromRawMulti(
            query,
            auth,
            await query<RawEntry[]>`
            SELECT id,
                   created,
                   createdTZOffset,
                   flags,
                   latitude,
                   longitude,
                   title,
                   entry,
                   label,
                   agentData
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
        `
        );
    }

    async function fromRawMulti(
        query: QueryFunc,
        auth: Auth,
        raw: RawEntry[]
    ): Promise<Result<Entry[]>> {
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

        const { err: editsErr, val: edits } = Result.collect(
            await Promise.all(
                rawEdits.map(async (e): Promise<Result<Entry & { entryId: string }>> => {
                    const entry = await Entry.fromRaw(query, auth, e, true);
                    if (entry.err) return Result.err(entry.err);
                    return Result.ok({
                        ...entry.val,
                        entryId: e.entryId
                    });
                })
            )
        );
        if (editsErr) return Result.err(editsErr);

        const groupedEdits = edits.reduce<Record<string, EntryEdit[]>>((prev, edit) => {
            if (!edit.entryId) return prev;
            prev[edit.entryId] ??= [];
            prev[edit.entryId].push(edit);
            return prev;
        }, {});

        const { err, val: labels } = await Label.all(query, auth);
        if (err) return Result.err(err);

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

                const entry: Entry = {
                    id: rawEntry.id,
                    title: decryptedTitle,
                    entry: decryptedEntry,
                    created: rawEntry.created,
                    createdTZOffset: rawEntry.createdTZOffset,
                    flags: rawEntry.flags,
                    latitude: rawEntry.latitude,
                    longitude: rawEntry.longitude,
                    agentData: decryptedAgentData
                };

                entry.edits = groupedEdits[rawEntry.id];

                if (rawEntry.label) {
                    entry.label = groupedLabels[rawEntry.label];
                }

                return Result.ok(entry);
            })
        );
    }

    async function addLabel(
        query: QueryFunc,
        auth: Auth,
        self: Entry,
        label: Label | string
    ): Promise<Result<Entry>> {
        if (typeof label === 'string') {
            const { val, err } = await Label.fromId(query, auth, label);
            if (err) {
                return Result.err(err);
            }
            self.label = val;
        } else {
            self.label = label;
        }

        return Result.ok(self);
    }

    async function addEdits(query: QueryFunc, auth: Auth, self: Entry): Promise<Result<EntryEdit>> {
        const rawEdits = await query<RawEntry[]>`
            SELECT created, createdTZOffset, latitude, longitude, title, entry, label, agentData
            FROM entryEdits
            WHERE entryId = ${self.id}
        `;

        const { err, val: edits } = Result.collect(
            await Promise.all(rawEdits.map(e => Entry.fromRaw(query, auth, e, true)))
        );
        if (err) return Result.err(err);

        self.edits = edits;

        return Result.ok(self);
    }
}

export const Entry = EntryUtils;
