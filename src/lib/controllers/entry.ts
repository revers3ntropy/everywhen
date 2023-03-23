import type { QueryFunc } from '../db/mysql';
import { decrypt, encrypt } from '../security/encryption';
import { generateUUId } from '../security/uuid';
import { Result } from '../utils/result';
import { nowS } from '../utils/time';
import type { PickOptionalAndMutable } from '../utils/types';
import { Label } from './label';
import type { Auth } from './user';


// RawEntry is the raw data from the database,
// Entry is the data after decryption and links to labels
export type RawEntry =
    Omit<
        Entry, 'label'
               | 'decrypted'
               | 'clone'
               | 'removeLabel'
               | 'updateLabel'
    > & {
        label?: string,
        decrypted: false
    };

export type DecryptedRawEntry = Omit<RawEntry, 'decrypted'> & {
    decrypted: true
};

export type EntryEdit = Omit<Entry, 'edits'>;

export class Entry {
    public label?: Label;
    public edits?: EntryEdit[];
    public readonly decrypted = true;

    private constructor (
        public readonly id: string,
        public readonly title: string,
        public readonly entry: string,
        public readonly created: number,
        public readonly deleted: boolean,
        public readonly latitude?: number,
        public readonly longitude?: number,
    ) {
    }

    public static async delete (
        query: QueryFunc,
        auth: Auth,
        id: string,
        restore: boolean,
    ): Promise<Result> {
        const entry = await query`
            SELECT deleted
            FROM entries
            WHERE id = ${id}
              AND user = ${auth.id}
        `;

        if (!entry.length) {
            return Result.err('Entry not found');
        }
        if (!!entry[0].deleted === !restore) {
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

    public static async purgeAll (
        query: QueryFunc,
        auth: Auth,
    ): Promise<void> {
        await query`
            DELETE
            FROM entries
            WHERE user = ${auth.id}
        `;
    }

    public static async allRaw (
        query: QueryFunc,
        auth: Auth,
        deleted: boolean | 'both' = false,
    ): Promise<RawEntry[]> {
        return await query<RawEntry[]>`
            SELECT id,
                   created,
                   title,
                   deleted,
                   label,
                   entry,
                   latitude,
                   longitude
            FROM entries
            WHERE (deleted = ${deleted ? 1 : 0} OR ${deleted === 'both'})
              AND user = ${auth.id}
            ORDER BY created DESC, id
        `;
    }

    public static async all (
        query: QueryFunc,
        auth: Auth,
        deleted: boolean | 'both' = false,
    ): Promise<Result<Entry[]>> {
        const rawEntries = await Entry.allRaw(query, auth, deleted);

        const entries = [];

        for (const rawEntry of rawEntries) {
            const { err, val } = await Entry.fromRaw(query, auth, rawEntry);
            if (err) return Result.err(err);
            entries.push(val);
        }

        return Result.ok(entries);
    }

    public static async getPage (
        query: QueryFunc,
        auth: Auth,
        page: number,
        pageSize: number,
        {
            deleted = false,
            labelId = undefined,
            search = undefined,
        }: {
            deleted?: boolean | 'both',
            labelId?: string,
            search?: Lowercase<string>
        } = {},
    ): Promise<Result<[ Entry[], number ]>> {
        const rawEntries = await Entry.allRaw(query, auth, deleted);

        let { val: entries, err } = await Result.awaitCollect(
            rawEntries.map((e) => Entry.fromRaw(query, auth, e)),
        );
        if (err) return Result.err(err);

        if (labelId) {
            entries = entries.filter((e) => e.label?.id === labelId);
        }
        if (search) {
            entries = entries.filter((e) => {
                return e.title.toLowerCase().includes(search)
                    || e.entry.toLowerCase().includes(search);
            });
        }

        const start = page * pageSize;
        const end = start + pageSize;

        return Result.ok([
            entries.slice(start, end),
            entries.length,
        ]);
    }

    public static async fromRaw (
        query: QueryFunc,
        auth: Auth,
        rawEntry: RawEntry,
        isEdit = false,
    ): Promise<Result<Entry>> {
        const { err: titleErr, val: decryptedTitle } = decrypt(rawEntry.title, auth.key);
        if (titleErr) return Result.err(titleErr);

        const { err: entryErr, val: decryptedEntry } = decrypt(rawEntry.entry, auth.key);
        if (entryErr) return Result.err(entryErr);

        let entry = new Entry(
            rawEntry.id,
            decryptedTitle,
            decryptedEntry,
            rawEntry.created,
            rawEntry.deleted,
        );

        if (rawEntry.label) {
            const { err, val } = await Entry.addLabel(
                query, auth, entry, rawEntry.label,
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

    public static groupEntriesByDay<T extends { created: number } = Entry> (
        entries: T[],
    ): Record<number, T[]> {
        const grouped: Record<number, T[]> = [];

        entries.forEach((entry) => {
            const day =
                new Date(entry.created * 1000)
                    .setHours(0, 0, 0, 0)
                    .valueOf() / 1000;
            if (!grouped[day]) {
                grouped[day] = [];
            }
            grouped[day].push(entry);
        });

        // sort each day
        for (const day in grouped) {
            grouped[day].sort((a, b) => {
                return b.created - a.created;
            });
        }

        return grouped;
    }

    /**
     * Returns a decrypted `Entry` with (optional) decrypted `Label`.
     */
    public static async fromId (
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
                   title,
                   entry,
                   latitude,
                   longitude
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

    public static async decryptRaw<T extends RawEntry | RawEntry[]> (
        auth: Auth,
        raw: T,
    ): Promise<Result<T extends RawEntry ? DecryptedRawEntry : DecryptedRawEntry[]>> {
        if (Array.isArray(raw)) {
            const decrypted = [];

            for (const entry of raw as RawEntry[]) {
                const { val, err } = await Entry.decryptRaw(auth, entry);
                if (err) return Result.err(err);
                decrypted.push(val);
            }

            return Result.ok(
                decrypted as T extends RawEntry
                    ? DecryptedRawEntry
                    : DecryptedRawEntry[],
            );
        }

        return Result.ok({
            ...raw,
            title: decrypt(raw.title, auth.key),
            entry: decrypt(raw.entry, auth.key),
            decrypted: true,
        } as unknown as T extends RawEntry ? DecryptedRawEntry : DecryptedRawEntry[]);
    }


    public static jsonIsRawEntry (
        json: unknown,
    ): json is Omit<Entry, 'id' | 'label'> & {
        label?: string
    } {
        return typeof json === 'object'
            && json !== null
            && 'title' in json
            && typeof json.title === 'string'
            && 'entry' in json
            && typeof json.entry === 'string'
            && (
                !('latitude' in json)
                || typeof json.latitude === 'number'
                || json.latitude === null
            )
            && (
                !('longitude' in json)
                || typeof json.longitude === 'number'
                || json.longitude === null
            )
            && (
                !('label' in json)
                || typeof json.label === 'string'
                || !json.label
            )
            && 'created' in json
            && typeof json.created === 'number';
    }

    public static async create (
        query: QueryFunc,
        auth: Auth,
        json_: PickOptionalAndMutable<
            DecryptedRawEntry,
            'id'
            | 'deleted'
            | 'decrypted'
            | 'created'
        >,
    ): Promise<Result<Entry>> {
        const json: typeof json_ & { id: string } = {
            ...json_,
            id: await generateUUId(query),
        };
        json.created ??= nowS();

        const entry = new Entry(
            json.id,
            json.title,
            json.entry,
            json.created,
            !!json.deleted,
        );

        if (json.label) {
            const { err } = await Entry.addLabel(query, auth, entry, json.label);
            if (err) return Result.err(err);
        }

        const { err: titleErr, val: encryptedTitle } = encrypt(entry.title, auth.key);
        if (titleErr) return Result.err(titleErr);

        const { err: entryErr, val: encryptedEntry } = encrypt(entry.entry, auth.key);
        if (entryErr) return Result.err(entryErr);

        await query`
            INSERT INTO entries
                (id, user, title, entry, created, deleted, label, latitude, longitude)
            VALUES (${entry.id},
                    ${auth.id},
                    ${encryptedTitle},
                    ${encryptedEntry},
                    ${entry.created},
                    ${entry.deleted},
                    ${entry.label?.id ?? null},
                    ${entry.latitude ?? null},
                    ${entry.longitude ?? null})
        `;

        return Result.ok(entry);
    }

    public static async removeLabel (
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

    public static async updateLabel (
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

    public static clone (self: Entry): Entry {
        const entry = new Entry(
            self.id,
            self.title,
            self.entry,
            self.created,
            self.deleted,
            self.latitude,
            self.longitude,
        );
        entry.label = self.label;
        return entry;
    }

    public static async edit (
        query: QueryFunc,
        auth: Auth,
        entry: Entry,
        newTitle: string,
        newEntry: string,
        newLatitude: number,
        newLongitude: number,
        newLabel: Label | string,
    ): Promise<Result> {
        const { err: titleErr, val: encryptedNewTitle } = encrypt(newTitle, auth.key);
        if (titleErr) return Result.err(titleErr);
        const { err: entryErr, val: encryptedNewEntry } = encrypt(newEntry, auth.key);
        if (entryErr) return Result.err(entryErr);

        const editId = await generateUUId(query);

        const { err: oldTitleErr, val: oldTitle } = encrypt(entry.title, auth.key);
        if (oldTitleErr) return Result.err(oldTitleErr);
        const { err: oldEntryErr, val: oldEntry } = encrypt(entry.entry, auth.key);
        if (oldEntryErr) return Result.err(oldEntryErr);

        await query`
            INSERT INTO entryEdits
                (id, entryId, created, latitude, longitude, title, entry, label)
            VALUES (${editId},
                    ${entry.id},
                    ${entry.created},
                    ${entry.latitude ?? null},
                    ${entry.longitude ?? null},
                    ${oldTitle},
                    ${oldEntry},
                    ${entry.label?.id ?? null})
        `;

        if (newLabel instanceof Label) {
            newLabel = newLabel.id;
        }

        await query`
            UPDATE entries
            SET title     = ${encryptedNewTitle},
                entry     = ${encryptedNewEntry},
                latitude  = ${newLatitude ?? null},
                longitude = ${newLongitude ?? null},
                label     = ${newLabel ?? null},
                created   = ${nowS()}
            WHERE id = ${entry.id}
              AND user = ${auth.id}
        `;

        return Result.ok(null);
    }

    private static async addLabel (
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

    private static async addEdits (
        query: QueryFunc,
        auth: Auth,
        self: Entry,
    ): Promise<Result<EntryEdit>> {
        const rawEdits = await query<RawEntry[]>`
            SELECT created, latitude, longitude, title, entry, label
            FROM entryEdits
            WHERE entryId = ${self.id}
        `;

        const { err, val: edits } = Result.collect(await Promise.all(
            rawEdits.map(e => Entry.fromRaw(query, auth, e, true)),
        ));
        if (err) return Result.err(err);

        self.edits = edits;

        return Result.ok(self);
    }
}