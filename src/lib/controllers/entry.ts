import { Label } from './label';
import { Result } from '../utils';
import { query } from '../db/mysql';

type RawEntry = Omit<Entry, 'label'> & {
    label?: string
};

export class Entry {
    public label?: Label;

    private constructor (
        public id: string,
        public title: string,
        public entry: string,
        public created: number,
        public deleted: boolean,
        public latitude?: number,
        public longitude?: number
    ) {
    }

    public static async delete (userId: string, id: string, restore: boolean): Promise<Result> {
        const entry = await query`
            SELECT deleted
            FROM entries
            WHERE id = ${id}
              AND user = ${userId}
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
              AND user = ${userId}
        `;

        return Result.ok(null);
    }

    public static groupEntriesByDay (entries: Entry[]): Record<number, Entry[]> {
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

    public static async fromId (userId: string, id: string, mustNotBeDeleted = true): Promise<Result<Entry>> {
        const entries = await query<RawEntry[]>`
            SELECT label, deleted
            FROM entries
            WHERE id = ${id}
              AND user = ${userId}
        `;

        if (entries.length !== 1) {
            return Result.err('Entry not found');
        }
        if (mustNotBeDeleted && entries[0].deleted) {
            return Result.err('Entry is deleted');
        }

        let entry = new Entry(
            id,
            entries[0].title,
            entries[0].entry,
            entries[0].created,
            entries[0].deleted,
            entries[0].latitude,
            entries[0].longitude
        );

        if (entries[0].label) {
            const {
                val: newEntry,
                err
            } = (await entry.addLabel(userId, entries[0].label)).resolve();
            if (err) {
                return Result.err(err);
            }
            entry = newEntry;
        }

        return Result.ok(entry);
    }

    public async removeLabel (userId: string): Promise<Result<Entry>> {
        if (!this.label) {
            return Result.err('Entry does not have a label to remove');
        }

        await query`
            UPDATE entries
            SET label = ${null}
            WHERE entries.id = ${this.id}
              AND user = ${userId}
        `;

        this.label = undefined;
        return Result.ok(this);
    }

    public async updateLabel (userId: string, label: Label | string | null): Promise<Result<Entry>> {
        if (label == null) {
            return this.removeLabel(userId);
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
              AND user = ${userId}
        `;

        const res = await this.addLabel(userId, label);
        if (res.isErr) {
            return Result.err(res.unwrapErr());
        }

        return Result.ok(res.unwrap());
    }

    private async addLabel (userId: string, label: Label | string): Promise<Result<Entry>> {
        if (typeof label === 'string') {
            const res = await Label.fromId(userId, label);
            if (res.isErr) {
                return Result.err(res.unwrapErr());
            }
            this.label = res.unwrap();
        } else {
            this.label = label;
        }

        return Result.ok(this);
    }
}