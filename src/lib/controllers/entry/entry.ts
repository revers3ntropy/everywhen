import { LS_KEYS } from '$lib/constants';
import { Day } from '$lib/utils/day';
import { decrypt, encrypt } from '$lib/utils/encryption';
import { fmtUtc } from '$lib/utils/time';
import type { Hours, TimestampSecs } from '../../../types';

// assumed not deleted
export interface EntryAsLocation {
    id: string;
    created: number;
    latitude: number | null;
    longitude: number | null;
}

export interface EntryFilter {
    readonly search?: string;
    readonly labelId?: string;
    readonly locationId?: string;
    readonly deleted?: boolean | 'both';
    readonly onlyWithLocation?: boolean;
}

export interface Streaks {
    current: number;
    longest: number;
    runningOut: boolean;
}

export interface RawEntryEdit {
    id: string;
    entryId: string;
    created: TimestampSecs;
    createdTzOffset: Hours;
    latitude: number | null;
    longitude: number | null;
    agentData: string;
    oldTitle: string;
    oldBody: string;
    oldLabelId: string | null;
}

export interface EntryEdit {
    id: string;
    entryId: string;
    created: TimestampSecs;
    createdTzOffset: Hours;
    latitude: number | null;
    longitude: number | null;
    agentData: string;
    oldTitle: string;
    oldBody: string;
    oldLabelId: string | null;
}

// RawEntry is the raw data from the database,
// Entry is the data after decryption and links to labels
export interface RawEntry {
    id: string;
    title: string;
    body: string;
    created: TimestampSecs;
    createdTzOffset: Hours;
    pinned: number | null;
    deleted: number | null;
    latitude: number | null;
    longitude: number | null;
    agentData: string;
    wordCount: number;
    labelId: string | null;
}

export interface Entry {
    id: string;
    title: string;
    body: string;
    created: TimestampSecs;
    createdTzOffset: Hours;
    pinned: number | null;
    deleted: number | null;
    latitude: number | null;
    longitude: number | null;
    agentData: string;
    wordCount: number;
    labelId: string | null;
    edits: EntryEdit[];
}

// assumed not deleted
export interface EntrySummary {
    id: string;
    titleShortened: string;
    bodyShortened: string;
    created: TimestampSecs;
    createdTzOffset: Hours;
    pinned: number | null;
    latitude: number | null;
    longitude: number | null;
    agentData: string;
    wordCount: number;
    labelId: string | null;
}

// assumed not deleted
export interface RawEntrySummary {
    id: string;
    title: string;
    body: string;
    created: TimestampSecs;
    createdTzOffset: Hours;
    pinned: number | null;
    latitude: number | null;
    longitude: number | null;
    agentData: string;
    wordCount: number;
    labelId: string | null;
}

export namespace Entry {
    export const TITLE_LENGTH_CUTOFF = 30;

    export function isDeleted(self: { deleted: number | null }): boolean {
        return typeof self.deleted === 'number';
    }

    export function isPinned(self: { pinned: number | null }): boolean {
        return typeof self.pinned === 'number';
    }

    /**
     * Mutates the 'grouped' parameter and arrays it contains
     */
    export function groupEntriesByDay<
        T extends {
            created: TimestampSecs;
            createdTzOffset: Hours;
        }
    >(entries: T[], grouped: Record<string, T[]> = {}, sortEachDay = true): Record<string, T[]> {
        for (const entry of entries) {
            const localDate = fmtUtc(entry.created, entry.createdTzOffset, 'YYYY-MM-DD');
            grouped[localDate] ??= [];
            grouped[localDate].push(entry);
        }

        if (sortEachDay) {
            for (const day of Object.keys(grouped)) {
                grouped[day].sort((a, b) => b.created - a.created);
            }
        }

        return grouped;
    }

    export function stringToShortTitle(str: string): string {
        return str.replace(/\s+/gi, ' ').substring(0, TITLE_LENGTH_CUTOFF);
    }

    export function summaryFromEntry(entry: Entry): EntrySummary {
        return {
            id: entry.id,
            titleShortened: stringToShortTitle(entry.title),
            bodyShortened: stringToShortTitle(entry.body),
            created: entry.created,
            createdTzOffset: entry.createdTzOffset,
            pinned: entry.pinned,
            latitude: entry.latitude,
            longitude: entry.longitude,
            agentData: entry.agentData,
            wordCount: entry.wordCount,
            labelId: entry.labelId
        };
    }

    export function localTime(entry: {
        created: TimestampSecs;
        createdTzOffset: Hours;
    }): TimestampSecs {
        return entry.created + entry.createdTzOffset * 60 * 60;
    }

    export function titleLsKey(username: string | null, editing: Entry | null): string {
        return `${LS_KEYS.newEntryTitle}-${username ?? ''}-${editing?.id ?? ''}`;
    }
    export function bodyLsKey(username: string | null, editing: Entry | null): string {
        return `${LS_KEYS.newEntryBody}-${username ?? ''}-${editing?.id ?? ''}`;
    }
    export function labelLsKey(username: string | null, editing: Entry | null): string {
        return `${LS_KEYS.newEntryLabel}-${username ?? ''}-${editing?.id ?? ''}`;
    }

    export function clearEntryFormKeys(username: string | null, storage: Storage): void {
        for (const keyStart of [
            titleLsKey(username, null),
            bodyLsKey(username, null),
            labelLsKey(username, null)
        ]) {
            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                if (key?.startsWith(keyStart)) storage.removeItem(key);
            }
        }
    }

    export function dayOf(entry: { created: number; createdTzOffset: number }): Day {
        return Day.fromTimestamp(entry.created, entry.createdTzOffset);
    }

    export function quoteEntryInEntryForm(
        username: string,
        encryptionKey: string,
        entryId: string,
        quote: string
    ) {
        const link = `/journal#${entryId}`;
        let entryText = `> [${quote.replace(/(\r\n|\n|\r)/gm, ' ')}](${link})`;

        // directly edit local storage and then reload page
        const encryptedEntryBody = localStorage.getItem(Entry.bodyLsKey(username, null));
        if (encryptedEntryBody) {
            const currentEntry = decrypt(encryptedEntryBody, encryptionKey).or('');
            if (currentEntry) {
                entryText = `${currentEntry}\n\n${entryText}`;
            }
        }
        localStorage.setItem(Entry.bodyLsKey(username, null), encrypt(entryText, encryptionKey));
        window.location.assign('/journal');
    }
}
