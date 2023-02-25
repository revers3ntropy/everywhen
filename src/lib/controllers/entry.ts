import type { Writeable } from '../utils';
import { query } from '../db/mysql';
import { decrypt, encrypt } from '../security/encryption';
import { generateUUId } from '../security/uuid';
import { Result } from '../utils';
import { Label } from './label';
import type { User } from './user';


// RawEntry is the raw data from the database,
// Entry is the data after decryption and links to labels
export type RawEntry = Omit<Entry, 'label' | 'decrypted'> & {
    label?: string,
    decrypted: false
};

export type DecryptedRawEntry = Omit<RawEntry, 'decrypted'> & {
    decrypted: true
};

export class Entry {
    public label?: Label;
    public readonly decrypted = true;

    private constructor (
        public readonly id: string,
        public readonly title: string,
        public readonly entry: string,
        public readonly created: number,
        public readonly deleted: boolean,
        public readonly latitude?: number,
        public readonly longitude?: number
    ) {
    }

    public static async delete (
        auth: User,
        id: string,
        restore: boolean
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

    public static async purgeWithId (auth: User, id: string): Promise<void> {
        await query`
            DELETE
            FROM entries
            WHERE entries.id = ${id}
              AND user = ${auth.id}
        `;

    }

    public static async allRaw (auth: User, deleted = false)
        : Promise<RawEntry[]> {
        return await query<RawEntry[]>`
            SELECT id,
                   created,
                   title,
                   deleted,
                   label,
                   entry
            FROM entries
            WHERE deleted = ${deleted}
              AND entries.user = ${auth.id}
            ORDER BY created DESC, id
        `;
    }

    public static async all (auth: User, deleted = false)
        : Promise<Result<Entry[]>> {
        const rawEntries = await Entry.allRaw(auth, deleted);

        const entries = [];

        for (const rawEntry of rawEntries) {
            const { err, val } = await Entry.fromRaw(auth, rawEntry);
            if (err) {
                return Result.err(err);
            }
            entries.push(val);
        }

        return Result.ok(entries);
    }

    public static async fromRaw (
        auth: User,
        rawEntry: RawEntry
    ): Promise<Result<Entry>> {
        const entry = new Entry(
            rawEntry.id,
            decrypt(auth.key, rawEntry.title),
            decrypt(auth.key, rawEntry.entry),
            rawEntry.created,
            rawEntry.deleted
        );

        if (rawEntry.label) {
            const { err } = await entry.addLabel(auth, rawEntry.label);
            if (err) return Result.err(err);
        }

        return Result.ok(entry);
    }

    public static groupEntriesByDay (
        entries: Entry[]
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

    public static async fromId (
        auth: User,
        id: string,
        mustNotBeDeleted = true
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

        return await Entry.fromRaw(auth, entries[0]);
    }

    public static async decryptRaw<T extends RawEntry | RawEntry[]> (
        auth: User,
        raw: T
    ): Promise<Result<T extends RawEntry ? DecryptedRawEntry : DecryptedRawEntry[]>> {
        if (Array.isArray(raw)) {
            const decrypted = [];

            for (const entry of raw as RawEntry[]) {
                const { val, err } = await Entry.decryptRaw(auth, entry);
                if (err) return Result.err(err);
                decrypted.push(val);
            }

            return Result.ok(decrypted as T extends RawEntry ? DecryptedRawEntry : DecryptedRawEntry[]);
        }
        return Result.ok({
            ...raw,
            title: decrypt(auth.key, raw.title),
            entry: decrypt(auth.key, raw.entry),
            decrypted: true
        } as unknown as T extends RawEntry ? DecryptedRawEntry : DecryptedRawEntry[]);
    }

    public static jsonIsRawEntry<T extends RawEntry | DecryptedRawEntry> (
        json: unknown
    ): json is T {
        return typeof json === 'object'
            && json !== null
            && (!('deleted' in json) || typeof json.deleted === 'boolean')
            && 'title' in json
            && typeof json.title !== 'string'
            && 'entry' in json
            && typeof json.entry !== 'string'
            && 'latitude' in json
            && typeof json.latitude !== 'number'
            && 'longitude' in json
            && typeof json.longitude !== 'number'
            && (
                !('label' in json)
                || typeof json.label === 'string'
                || json.label !== null
            )
            && 'created' in json
            && typeof json.created !== 'number'
            && 'id' in json
            && typeof json.id !== 'string';
    }

    public static async create (
        auth: User,
        json: Omit<DecryptedRawEntry, 'id'>
              & Partial<Writeable<Pick<DecryptedRawEntry, 'id'>>>
    ): Promise<Result<Entry>> {
        if (!json.id) {
            json.id = await generateUUId();
        }
        const entry = new Entry(
            json.id,
            json.title,
            json.entry,
            json.created,
            json.deleted
        );

        if (json.label) {
            const { err } = await entry.addLabel(auth, json.label);
            if (err) return Result.err(err);
        }

        await query`
            INSERT INTO entries
                (id, user, title, entry, created, deleted, label, latitude, longitude)
            VALUES (${entry.id},
                    ${auth.id},
                    ${encrypt(auth.key, entry.title)},
                    ${encrypt(auth.key, entry.entry)},
                    ${entry.created},
                    ${entry.deleted},
                    ${entry.label?.id ?? null},
                    ${entry.latitude},
                    ${entry.longitude})
        `;

        return Result.ok(entry);
    }

    public async removeLabel (auth: User): Promise<Result<Entry>> {
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

    public async updateLabel (auth: User, label: Label | string | null): Promise<Result<Entry>> {
        if (label == null) {
            return this.removeLabel(auth);
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

        return await this.addLabel(auth, label);
    }

    public clone (): Entry {
        const entry = new Entry(
            this.id,
            this.title,
            this.entry,
            this.created,
            this.deleted,
            this.latitude,
            this.longitude
        );
        entry.label = this.label;
        return entry;
    }

    private async addLabel (auth: User, label: Label | string): Promise<Result<Entry>> {
        if (typeof label === 'string') {
            const { val, err } = await Label.fromId(auth, label);
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