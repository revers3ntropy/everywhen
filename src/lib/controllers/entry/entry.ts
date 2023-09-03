import { fmtUtc } from '$lib/utils/time';
import type { Hours, TimestampSecs } from '../../../types';
import type { Label } from '../label/label';

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
    oldLabel: Label | null;
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
    label: Label | null;
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
    label: Label | null;
    editCount: number;
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
    editCount: number;
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
            createdTzOffset: Hours;
        }
    >(entries: T[], grouped: Record<string, T[]> = {}): Record<string, T[]> {
        entries.forEach(entry => {
            const localDate = fmtUtc(entry.created, entry.createdTzOffset, 'YYYY-MM-DD');
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
            label: entry.label,
            editCount: entry.edits.length
        };
    }

    export function localTime(entry: {
        created: TimestampSecs;
        createdTzOffset: Hours;
    }): TimestampSecs {
        return entry.created + entry.createdTzOffset * 60 * 60;
    }
}
