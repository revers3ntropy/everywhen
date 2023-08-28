import { fmtUtc } from '$lib/utils/time';
import type { Label } from '../label/label';

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

export interface EntryEdit {
    id: string;
    entryId: string;
    created: TimestampSecs;
    createdTZOffset: Hours;
    latitude: number | null;
    longitude: number | null;
    title: string;
    entry: string;
    agentData: string | null;
    label: Label | null;
}

export interface RawEntryEdit {
    id: string;
    entryId: string;
    created: TimestampSecs;
    createdTZOffset: Hours;
    latitude: number | null;
    longitude: number | null;
    title: string;
    entry: string;
    agentData: string | null;
    label: string | null;
}

// RawEntry is the raw data from the database,
// Entry is the data after decryption and links to labels
export interface RawEntry {
    id: string;
    title: string;
    entry: string;
    created: TimestampSecs;
    createdTZOffset: Hours;
    pinned: number | null;
    deleted: number | null;
    latitude: number | null;
    longitude: number | null;
    agentData: string | null;
    wordCount: number;
    label: string | null;
}

export interface Entry {
    id: string;
    title: string;
    entry: string;
    created: TimestampSecs;
    createdTZOffset: Hours;
    pinned: number | null;
    deleted: number | null;
    latitude: number | null;
    longitude: number | null;
    agentData: string | null;
    wordCount: number;
    label: Label | null;
    edits: EntryEdit[];
}

export namespace Entry {
    export const TITLE_LENGTH_CUTOFF = 30;

    export function isDeleted(self: { deleted: number | null }): boolean {
        return typeof self.deleted === 'number';
    }

    export function isPinned(self: { pinned: number | null }): boolean {
        return typeof self.pinned === 'number';
    }

    export function groupEntriesByDay<
        T extends {
            created: TimestampSecs;
            createdTZOffset: Hours;
        } = Entry
    >(entries: T[], grouped: Record<string, T[]> = {}): Record<string, T[]> {
        entries.forEach(entry => {
            const localDate = fmtUtc(entry.created, entry.createdTZOffset, 'YYYY-MM-DD');
            grouped[localDate] ??= [];
            grouped[localDate].push(entry);
        });

        // sort each day
        for (const day of Object.keys(grouped)) {
            grouped[day].sort((a, b) => {
                return b.created - a.created;
            });
        }

        return grouped;
    }

    function stringToShortTitle(str: string): string {
        return str.replace(/\s+/gi, ' ').substring(0, TITLE_LENGTH_CUTOFF);
    }

    export function entryToTitleEntry(entry: Entry): Entry {
        return {
            ...entry,
            entry: stringToShortTitle(entry.entry)
        };
    }

    export function localTime(entry: {
        created: TimestampSecs;
        createdTZOffset: Hours;
    }): TimestampSecs {
        return entry.created + entry.createdTZOffset * 60 * 60;
    }
}
