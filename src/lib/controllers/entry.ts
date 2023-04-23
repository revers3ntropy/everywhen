import type { QueryFunc } from '../db/mysql';
import { decrypt, encrypt, encryptMulti } from '../security/encryption';
import { Result } from '../utils/result';
import { currentTzOffset, fmtUtc, nowS } from '../utils/time';
import type {
    Hours,
    Mutable,
    PickOptionalAndMutable,
    TimestampSecs,
} from '../utils/types';
import { Label } from './label';
import { Location } from './location';
import type { Auth } from './user';
import { UUID } from './uuid';

export interface EntryFilter {
    readonly search?: string;
    readonly labelId?: string;
    readonly locationId?: string;
    readonly deleted?: boolean | 'both';
}

export interface Streaks {
    current: number;
    longest: number;
    runningOut: boolean;
}

// RawEntry is the raw data from the database,
// Entry is the data after decryption and links to labels
export type RawEntry = Omit<Entry, 'label' | 'decrypted'> & {
    label?: string;
    decrypted: false;
};

export type DecryptedRawEntry = Omit<RawEntry, 'decrypted'> & {
    decrypted: true;
};

export type EntryEdit = Omit<Entry, 'edits'> & { entryId?: string };

export class Entry {
    public static TITLE_CUTOFF = 25;

    public label?: Label;
    public edits?: EntryEdit[];
    public readonly decrypted = true;

    private constructor(
        public readonly id: string,
        public readonly title: string,
        public readonly entry: string,
        public readonly created: TimestampSecs,
        public readonly createdTZOffset: Hours,
        public readonly deleted: boolean,
        public readonly latitude: number | null,
        public readonly longitude: number | null,
        public readonly agentData: string
    ) {}

    public static async delete(
        query: QueryFunc,
        auth: Auth,
        id: string,
        restore: boolean
    ): ,Promise<Result> {
        const entry = await query<{ deleted: boolean }[]>`
            SELECT deleted
            FROM entries
            WHERE id = ${id}
              AND user = ${auth.id}
        `;

        if (!entry.length) {
            return Result.err('Entry not found');
        }
        if (entry[0].deleted === !restore) {
            return Result.err('Entry is already in that state');
        }

        await query`
            UPDATE entries
            SET deleted = ${!restore},
                label   = ${null}
            WHERE entries.id = ${id}
              AND user = ${auth.id}
        `;

        return Result.ok(null);
    }

    public static async purgeAll(query: QueryFunc, auth: Auth): Promise<void> {
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

    public static async allRaw(
        query: QueryFunc,
        auth: Auth,
        filter: Omit<EntryFilter, 'search'> = {},
    ): Promise<Result<RawEntry[]>> {
        let location: Location | undefined;
        if (filter.locationId) {
            const locationResult = await Location.fromId(
                query,
                auth,
                filter.locationId,
            );
            if (locationResult.err) return Result.err(locationResult.err);
            location = locationResult.val;
        }
        return Result.ok(
            await query<RawEntry[]>`
            SELECT id,
                   created,
                   createdTZOffset,
                   title,
                   deleted,
                   label,
                   entry,
                   latitude,
                   longitude,
                   agentData
            FROM entries
            WHERE (deleted = ${filter.deleted ? 1 : 0} OR ${
                filter.deleted === 'both'
            })
              AND (label = ${filter.labelId || ''} OR ${
                filter.labelId === undefined
            })
              AND (${location === undefined} OR (
                    latitude IS NOT NULL
                    AND longitude IS NOT NULL
                    AND SQRT(
                                    POW(latitude - ${
                                        location?.latitude || 0
                                    }, 2)
                                    + POW(longitude - ${
                                        location?.longitude || 0
                                    }, 2)
                            ) <= ${location?.radius || 0}
                ))
              AND user = ${auth.id}
            ORDER BY created DESC, id
        `,
        );
    }

    public static async all(
        query: QueryFunc,
        auth: Auth,
        filter: EntryFilter = {},
    ): Promise<Result<Entry[]>> {
        const { err, val: rawEntries } = await Entry.allRaw(
            query,
            auth,
            filter,
        );
        if (err) return Result.err(err);
        return Entry.fromRawMulti(query, auth, rawEntries);
    }

    public static async getPage(
        query: QueryFunc,
        auth: Auth,
        page: number,
        pageSize: number,
        filters: EntryFilter = {},
    ): Promise<Result<[Entry[], number]>> {
        const { val: rawEntries, err: rawErr } = await Entry.allRaw(
            query,
            auth,
            filters,
        );
        if (rawErr) return Result.err(rawErr);
        const { val, err } = await Entry.fromRawMulti(query, auth, rawEntries);
        if (err) return Result.err(err);
        let entries = val;

        if (filters.search) {
            entries = entries.filter(
                e =>
                    e.title.toLowerCase().includes(filters.search || '') ||
                    e.entry.toLowerCase().includes(filters.search || ''),
            );
        }

        const start = page * pageSize;
        const end = start + pageSize;

        return Result.ok([entries.slice(start, end), entries.length]);
    }

    public static async fromRaw(
        query: QueryFunc,
        auth: Auth,
        rawEntry: RawEntry,
        isEdit = false,
    ): Promise<Result<Entry>> {
        const { err: titleErr, val: decryptedTitle } = decrypt(
            rawEntry.title,
            auth.key,
        );
        if (titleErr) return Result.err(titleErr);

        const { err: entryErr, val: decryptedEntry } = decrypt(
            rawEntry.entry,
            auth.key,
        );
        if (entryErr) return Result.err(entryErr);

        const { err: agentErr, val: decryptedAgent } = decrypt(
            rawEntry.agentData,
            auth.key,
        );
        if (agentErr) return Result.err(agentErr);

        let entry = new Entry(
            rawEntry.id,
            decryptedTitle,
            decryptedEntry,
            rawEntry.created,
            rawEntry.createdTZOffset,
            rawEntry.deleted,
            rawEntry.latitude,
            rawEntry.longitude,
            decryptedAgent,
        );

        if (rawEntry.label) {
            const { err, val } = await Entry.addLabel(
                query,
                auth,
                entry,
                rawEntry.label,
            );
            if (err) return Result.err(err);
            entry = val;
        }

        if (!isEdit) {
            const { err, val } = await Entry.addEdits(query, auth, entry);
            if (err) return Result.err(err);
            entry = val;
        }

        return Result.ok(entry);
    }

    public static groupEntriesByDay<
        T extends {
            created: TimestampSecs;
            createdTZOffset: Hours;
        } = Entry
    >(entries: T[]): T[][] {
        const grouped: T[][] = [];

        entries.forEach(entry => {
            const localDate = fmtUtc(
                entry.created,
                entry.createdTZOffset,
                'YYYY-MM-DD',
            );
            const dayTimeStamp =
                new Date(localDate).setHours(12, 0, 0, 0) / 1000;
            grouped[dayTimeStamp] ??= [];
            grouped[dayTimeStamp].push(entry);
        });

        // sort each day
        for (const day of Object.keys(grouped)) {
            grouped[parseInt(day)].sort((a, b) => {
                return b.created - a.created;
            });
        }

        return grouped;
    }

    /**
     * Returns a decrypted `Entry` with (optional) decrypted `Label`.
     */
    public static async fromId(
        query: QueryFunc,
        auth: Auth,
        id: string,
        mustNotBeDeleted = true,
    ): Promise<Result<Entry>> {
        const entries = await query<RawEntry[]>`
            SELECT label,
                   deleted,
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
        if (mustNotBeDeleted && entries[0].deleted) {
            return Result.err('Entry is deleted');
        }

        return await Entry.fromRaw(query, auth, entries[0]);
    }

    public static jsonIsRawEntry(
        json: unknown,
        isEdit = false,
    ): json is Omit<Entry, 'id' | 'label'> & {
        label?: string;
    } {
        return (
            typeof json === 'object' &&
            json !== null &&
            'title' in json &&
            typeof json.title === 'string' &&
            'entry' in json &&
            typeof json.entry === 'string' &&
            (!('latitude' in json) ||
                typeof json.latitude === 'number' ||
                json.latitude === null) &&
            (!('longitude' in json) ||
                typeof json.longitude === 'number' ||
                json.longitude === null) &&
            (!('label' in json) ||
                typeof json.label === 'string' ||
                !json.label) &&
            (!('agentData' in json) ||
                typeof json.agentData === 'string' ||
                !json.agentData) &&
            'created' in json &&
            typeof json.created === 'number' &&
            (isEdit ||
                !('edits' in json) ||
                (Array.isArray(json.edits) &&
                    json.edits.every(e => Entry.jsonIsRawEntry(e, true))))
        );
    }

    public static async create(
        query: QueryFunc,
        auth: Auth,
        json_: PickOptionalAndMutable<
            DecryptedRawEntry,
            'id' | 'deleted' | 'decrypted' | 'created'
        >,
    ): Promise<Result<Entry>> {
        const json: typeof json_ & { id: string } = {
            ...json_,
            id: await UUID.generateUUId(query),
        };
        json.created ??= nowS();

        const entry = new Entry(
            json.id,
            json.title,
            json.entry,
            json.created,
            json.createdTZOffset,
            !!json.deleted,
            json.latitude,
            json.longitude,
            json.agentData,
        );

        entry.edits = await Promise.all(
            json.edits?.map(
                async e =>
                    new Entry(
                        await UUID.generateUUId(query),
                        e.title,
                        e.entry,
                        e.created,
                        e.createdTZOffset,
                        false,
                        e.latitude,
                        e.longitude,
                        e.agentData,
                    ),
            ) ?? [],
        );

        if (json.label) {
            const { err } = await Entry.addLabel(
                query,
                auth,
                entry,
                json.label,
            );
            if (err) return Result.err(err);
        }

        const { err: titleErr, val: encryptedTitle } = encrypt(
            entry.title,
            auth.key,
        );
        if (titleErr) return Result.err(titleErr);

        const { err: entryErr, val: encryptedEntry } = encrypt(
            entry.entry,
            auth.key,
        );
        if (entryErr) return Result.err(entryErr);

        const { err: agentErr, val: encryptedAgent } = encrypt(
            entry.agentData,
            auth.key,
        );
        if (agentErr) return Result.err(agentErr);

        await query`
            INSERT INTO entries
            (id, user, title, entry, created, createdTZOffset, deleted,
             label, latitude, longitude, agentData)
            VALUES (${entry.id},
                    ${auth.id},
                    ${encryptedTitle},
                    ${encryptedEntry},
                    ${entry.created},
                    ${entry.createdTZOffset ?? 0},
                    ${entry.deleted},
                    ${entry.label?.id ?? null},
                    ${entry.latitude ?? null},
                    ${entry.longitude ?? null},
                    ${encryptedAgent || ''})
        `;

        for (const edit of entry.edits) {
            const { err: editTitleErr, val: encryptedEditTitle } = encrypt(
                edit.title,
                auth.key,
            );
            if (editTitleErr) return Result.err(editTitleErr);

            const { err: editEntryErr, val: encryptedEditEntry } = encrypt(
                edit.entry,
                auth.key,
            );
            if (editEntryErr) return Result.err(editEntryErr);

            const { err: editAgentErr, val: encryptedAgentData } = encrypt(
                edit.agentData,
                auth.key,
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

    public static async removeLabel(
        query: QueryFunc,
        auth: Auth,
        self: Entry,
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

    public static async updateLabel(
        query: QueryFunc,
        auth: Auth,
        self: Entry,
        label: Label | string | null,
    ): Promise<Result<Entry>> {
        if (label == null) {
            return Entry.removeLabel(query, auth, self);
        }
        if (label instanceof Label) {
            label = label.id;
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

        return await Entry.addLabel(query, auth, self, label);
    }

    public static clone(self: Entry): Entry {
        const entry = new Entry(
            self.id,
            self.title,
            self.entry,
            self.created,
            self.createdTZOffset,
            self.deleted,
            self.latitude,
            self.longitude,
            self.agentData,
        );
        entry.label = self.label;
        return entry;
    }

    public static async edit(
        query: QueryFunc,
        auth: Auth,
        entry: Entry,
        newTitle: string,
        newEntry: string,
        newLatitude: number | undefined,
        newLongitude: number | undefined,
        newLabel: Label | string,
        tzOffset: number,
        agentData: string,
    ): Promise<Result> {
        const { err, val: encryptionResults } = encryptMulti(
            auth.key,
            newTitle,
            newEntry,
            entry.title,
            entry.entry,
        );
        if (err) return Result.err(err);
        const [encryptedNewTitle, encryptedNewEntry, oldTitle, oldEntry] =
            encryptionResults;

        const editId = await UUID.generateUUId(query);

        await query`
            INSERT INTO entryEdits
            (id, entryId, created, createdTZOffset, latitude, longitude, title, entry,
             label, agentData)
            VALUES (${editId},
                    ${entry.id},
                    ${nowS()},
                    ${tzOffset},
                    ${newLatitude ?? null},
                    ${newLongitude ?? null},
                    ${oldTitle},
                    ${oldEntry},
                    ${entry.label?.id ?? null},
                    ${agentData || ''})
        `;

        if (newLabel instanceof Label) {
            newLabel = newLabel.id;
        }

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

    public static async getTitles(
        query: QueryFunc,
        auth: Auth
    ): Promise<Result<Entry[]>> {
        const { val: entries, err } = await Entry.all(query, auth);
        if (err) return Result.err(err);

        entries.map((entry: Mutable<Entry>) => {
            entry.entry = entry.entry
                .replace(/[^0-9a-z ]/gi, '')
                .substring(0, Entry.TITLE_CUTOFF);
        });

        return Result.ok(entries);
    }

    public static async reassignAllLabels(
        query: QueryFunc,
        auth: Auth,
        oldLabel: string,
        newLabel: string,
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

    public static async removeAllLabel(
        query: QueryFunc,
        auth: Auth,
        labelId: string,
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

    public static async getStreaks(
        query: QueryFunc,
        auth: Auth,
    ): Promise<Result<Streaks>> {
        const entries = await query<
            { created: number; createdTZOffset: number }[]
        >`
            SELECT created, createdTZOffset
            FROM entries
            WHERE deleted = 0
              AND user = ${auth.id}
            ORDER BY created DESC, id
        `;

        if (entries.length < 1) {
            return Result.ok({
                current: 0,
                longest: 0,
                runningOut: false,
            });
        }

        const today = fmtUtc(nowS(), currentTzOffset(), 'YYYY-MM-DD');
        const yesterday = fmtUtc(
            nowS() - 86400,
            currentTzOffset(),
            'YYYY-MM-DD',
        );

        let current = 0;

        const entriesOnDay: Record<string, true | undefined> = {};
        for (const entry of entries) {
            entriesOnDay[
                fmtUtc(entry.created, entry.createdTZOffset, 'YYYY-MM-DD')
            ] = true;
        }

        const runningOut = !entriesOnDay[today] && !!entriesOnDay[yesterday];

        let currentDay = today;
        if (!entriesOnDay[currentDay]) {
            currentDay = yesterday;
        }
        while (entriesOnDay[currentDay]) {
            current++;
            currentDay = fmtUtc(
                new Date(currentDay).getTime() / 1000 - 86400,
                0,
                'YYYY-MM-DD',
            );
        }

        let longest = current;
        let currentStreak = 0;

        const firstEntry = entries[entries.length - 1];
        const firstDay = fmtUtc(
            firstEntry.created,
            firstEntry.createdTZOffset,
            'YYYY-MM-DD',
        );

        currentDay = today;
        while (currentDay !== firstDay) {
            currentDay = fmtUtc(
                new Date(currentDay).getTime() / 1000 - 86400,
                0,
                'YYYY-MM-DD',
            );
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
            runningOut,
        });
    }

    public static async near(
        query: QueryFunc,
        auth: Auth,
        location: Location,
        deleted: boolean | 'both' = false,
    ): Promise<Result<Entry[]>> {
        return await Entry.fromRawMulti(
            query,
            auth,
            await query<RawEntry[]>`
            SELECT id,
                   created,
                   createdTZOffset,
                   deleted,
                   latitude,
                   longitude,
                   title,
                   entry,
                   label,
                   agentData
            FROM entries
            WHERE (deleted = ${deleted ? 1 : 0} OR ${deleted === 'both'})
              AND user = ${auth.id}
              AND latitude IS NOT NULL
              AND longitude IS NOT NULL
              AND SQRT(
                              POW(latitude - ${location.latitude}, 2)
                              + POW(longitude - ${location.longitude}, 2)
                      ) <= ${location.radius}
        `,
        );
    }

    private static async fromRawMulti(
        query: QueryFunc,
        auth: Auth,
        raw: RawEntry[],
    ): Promise<Result<Entry[]>> {
        const edits = await query<EntryEdit[]>`
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

        const groupedEdits = edits.reduce<Record<string, EntryEdit[]>>(
            (prev, edit) => {
                if (!edit.entryId) return prev;
                prev[edit.entryId] ??= [];
                prev[edit.entryId].push(edit);
                return prev;
            },
            {},
        );

        const { err, val: labels } = await Label.all(query, auth);
        if (err) return Result.err(err);

        const groupedLabels = labels.reduce<Record<string, Label>>(
            (prev, label) => {
                prev[label.id] = label;
                return prev;
            },
            {},
        );

        return Result.collect(
            raw.map(rawEntry => {
                const { err: titleErr, val: decryptedTitle } = decrypt(
                    rawEntry.title,
                    auth.key,
                );
                if (titleErr) return Result.err(titleErr);

                const { err: entryErr, val: decryptedEntry } = decrypt(
                    rawEntry.entry,
                    auth.key,
                );
                if (entryErr) return Result.err(entryErr);

                const { err: agentErr, val: decryptedAgent } = decrypt(
                    rawEntry.agentData,
                    auth.key,
                );
                if (agentErr) return Result.err(agentErr);

                const entry = new Entry(
                    rawEntry.id,
                    decryptedTitle,
                    decryptedEntry,
                    rawEntry.created,
                    rawEntry.createdTZOffset,
                    rawEntry.deleted,
                    rawEntry.latitude,
                    rawEntry.longitude,
                    decryptedAgent,
                );

                entry.edits = groupedEdits[rawEntry.id];

                if (rawEntry.label) {
                    entry.label = groupedLabels[rawEntry.label];
                }

                return Result.ok(entry);
            }),
        );
    }

    private static async addLabel(
        query: QueryFunc,
        auth: Auth,
        self: Entry,
        label: Label | string,
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

    private static async addEdits(
        query: QueryFunc,
        auth: Auth,
        self: Entry,
    ): Promise<Result<EntryEdit>> {
        const rawEdits = await query<RawEntry[]>`
            SELECT created, createdTZOffset, latitude, longitude, title, entry, label
            FROM entryEdits
            WHERE entryId = ${self.id}
        `;

        const { err, val: edits } = Result.collect(
            await Promise.all(
                rawEdits.map(e => Entry.fromRaw(query, auth, e, true)),
            ),
        );
        if (err) return Result.err(err);

        self.edits = edits;

        return Result.ok(self);
    }
}
