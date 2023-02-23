import { Label } from "./label";
import { Result } from "../utils";

export class Entry {
    public label?: Label

    public constructor (
        public id: string,
        public title: string,
        public entry: string,
        public created: number,
        public deleted: boolean,
        public latitude?: number,
        public longitude?: number
    ) {}

    public async addLabel (label: Label | string): Promise<Result<Entry>> {
        if (typeof label === "string") {
            const res = await Label.fromId(label);
            if (res.isErr) {
                return Result.err(res.unwrapErr());
            }
            this.label = res.unwrap()
        } else {
            this.label = label;
        }

        return Result.ok(this);
    }

    public static groupEntriesByDay (entries: Entry[]): Record<number, Entry[]> {
        const grouped: Record<number, Entry[]> = [];

        if (!Array.isArray(entries)) {
            console.error("groupEntriesByDay: entries is not an array:", entries);
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
                return b.created - a.created
            });
        }

        return grouped;
    }
}

type RawEntry = Omit<Entry, "label"> & {
    label?: string
};