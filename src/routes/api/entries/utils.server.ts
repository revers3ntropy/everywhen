import { decrypt } from "$lib/security/encryption";
import type { Entry } from '$lib/types';

export function decryptEntry(entry: Entry, key: string): Entry {
    return {
        ...entry,
        entry: decrypt(entry.entry, key),
        title: entry.title ? decrypt(entry.title, key) : ''
    };
}

export function decryptEntries(entries: Entry[], key: string): Entry[] {
    return entries.map((entry) => decryptEntry(entry, key));
}