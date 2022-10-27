import { decrypt } from "$lib/security/encryption";

export function decryptEntry(entry: Record<string, any>, key: string): Record<string, any> {
    return {
        ...entry,
        entry: decrypt(entry.entry, key),
        title: entry.title ? decrypt(entry.title, key) : ''
    };
}

export function decryptEntries(entries: Record<string, any>[], key: string): Record<string, any>[] {
    return entries.map((entry) => decryptEntry(entry, key));
}