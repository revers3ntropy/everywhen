import type { QueryFunc } from '../db/mysql';
import { decrypt, encrypt } from '../security/encryption';
import { generateUUId } from '../security/uuid';
import type { NonFunctionProperties, PickOptionalAndMutable } from '../utils';
import { nowS, Result } from '../utils';
import { Controller } from './controller';
import { Label } from './label';
import type { User } from './user';


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

export class Entry extends Controller {
    public label?: Label;
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
        super();
    }

    public static async delete (
        query: QueryFunc,
        auth: User,
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
                label=${null}
            WHERE entries.id = ${id}
              AND user = ${auth.id}
        `;

        return Result.ok(null);
    }

    public static async purgeWithId (
        query: QueryFunc,
        auth: User,
        id: string,
    ): Promise<void> {
        await query`
            DELETE
            FROM entries
            WHERE entries.id = ${id}
              AND user = ${auth.id}
        `;
    }

    public static async purgeAll (
        query: QueryFunc,
        auth: User,
    ): Promise<void> {
        await query`
            DELETE
            FROM entries
            WHERE user = ${auth.id}
        `;
    }

    public static async allRaw (
        query: QueryFunc,
        auth: User,
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
              AND entries.user = ${auth.id}
            ORDER BY created DESC, id
        `;
    }

    public static async all (
        query: QueryFunc,
        auth: User,
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
        auth: User,
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
        auth: User,
        rawEntry: RawEntry,
    ): Promise<Result<Entry>> {
        const entry = new Entry(
            rawEntry.id,
            decrypt(rawEntry.title, auth.key),
            decrypt(rawEntry.entry, auth.key),
            rawEntry.created,
            rawEntry.deleted,
        );

        if (rawEntry.label) {
            const { err } = await entry.addLabel(
                query, auth, rawEntry.label);
            if (err) return Result.err(err);
        }

        return Result.ok(entry);
    }

    public static groupEntriesByDay (
        entries: Entry[],
    ): Record<number, Entry[]> {
        const grouped: Record<number, Entry[]> = [];

        if (!Array.isArray(entries)) {
            console.error('groupEntriesByDay: entries is not an array:', entries);
            return {};
        }

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
        auth: User,
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
        auth: User,
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
    ): json is Omit<NonFunctionProperties<Entry>, 'id' | 'label'> & {
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
        auth: User,
        json_: PickOptionalAndMutable<
            DecryptedRawEntry,
            'id'
            | 'deleted'
            | 'decrypted'
            | 'created'
        >,
    ): Promise<Result<Entry>> {
        const json = {
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
            const { err } = await entry.addLabel(query, auth, json.label);
            if (err) return Result.err(err);
        }

        await query`
            INSERT INTO entries
                (id, user, title, entry, created, deleted, label, latitude, longitude)
            VALUES (${entry.id},
                    ${auth.id},
                    ${encrypt(entry.title, auth.key)},
                    ${encrypt(entry.entry, auth.key)},
                    ${entry.created},
                    ${entry.deleted},
                    ${entry.label?.id ?? null},
                    ${entry.latitude ?? null},
                    ${entry.longitude ?? null})
        `;

        return Result.ok(entry);
    }

    public override json (): NonFunctionProperties<Entry> {
        return {
            ...this,
            label: this.label?.json(),
        };
    }

    public async removeLabel (
        query: QueryFunc,
        auth: User,
    ): Promise<Result<Entry>> {
        if (!this.label) {
            return Result.err('Entry does not have a label to remove');
        }

        await query`
            UPDATE entries
            SET label = ${null}
            WHERE entries.id = ${this.id}
              AND user = ${auth.id}
        `;

        this.label = undefined;
        return Result.ok(this);
    }

    public async updateLabel (
        query: QueryFunc,
        auth: User,
        label: Label | string | null,
    ): Promise<Result<Entry>> {
        if (label == null) {
            return this.removeLabel(query, auth);
        }
        if (label instanceof Label) {
            label = label.id;
        }

        if (this.label?.id === label) {
            return Result.err('Entry already has that label');
        }

        await query`
            UPDATE entries
            SET label = ${label}
            WHERE id = ${this.id}
              AND user = ${auth.id}
        `;

        return await this.addLabel(query, auth, label);
    }

    public clone (): Entry {
        const entry = new Entry(
            this.id,
            this.title,
            this.entry,
            this.created,
            this.deleted,
            this.latitude,
            this.longitude,
        );
        entry.label = this.label;
        return entry;
    }

    private async addLabel (query: QueryFunc, auth: User, label: Label | string): Promise<Result<Entry>> {
        if (typeof label === 'string') {
            const { val, err } = await Label.fromId(query, auth, label);
            if (err) {
                return Result.err(err);
            }
            this.label = val;
        } else {
            this.label = label;
        }

        return Result.ok(this);
    }
}