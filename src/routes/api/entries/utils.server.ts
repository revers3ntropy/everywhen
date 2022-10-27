import { decrypt } from "$lib/security/encryption";
import type { Entry, RawEntry } from "$lib/types";
import { query } from "../../../lib/db/mysql";

export function decryptEntry(entry: Entry, key: string): Entry {
    return {
        ...entry,
        entry: decrypt(entry.entry, key),
        title: decrypt(entry.title, key)
    };
}

export function decryptEntries(entries: Entry[], key: string): Entry[] {
    return entries.map((entry) => decryptEntry(entry, key));
}

export async function addLabelsToEntry (entry: RawEntry, key: string): Promise<Entry> {
    const labels = await query`
        SELECT
            id,
            name,
            colour
        FROM labels
    `;

    if (!entry.label) {
        delete entry.label;
        return entry as Entry;
    }
    const label = labels.find((label) => label.id === entry.label);
    if (!label) {
        delete entry.label;
        return entry as Entry;
    }
    return {
        ...entry,
        label: {
            id: entry.label,
            name: decrypt(label.name, key),
            colour: label.colour
        }
    } as Entry;
}

export async function addLabelsToEntries (entries: RawEntry[], key: string): Promise<Entry[]> {
    const labels = await query`
        SELECT
            id,
            name,
            colour
        FROM labels
    `;

    // hash table of labels for fast lookup
    const labelMap = new Map<string, { name: string, colour: string }>();
    labels.forEach((label) => {
        labelMap.set(label.id, { name: label.name, colour: label.colour });
    });

    return entries.map((entry): Entry => {
        if (!entry.label) {
            delete entry.label;
            return entry as Entry;
        }
        const label = labelMap.get(entry.label);
        if (!label) {
            delete entry.label;
            return entry as Entry;
        }
        return {
            ...entry,
            label: {
                id: entry.label,
                name: decrypt(label.name, key),
                colour: label.colour
            }
        } as Entry;
    });
}