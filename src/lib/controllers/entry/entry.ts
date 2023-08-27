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
    flags: number;
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
    flags: number;
    latitude: number | null;
    longitude: number | null;
    agentData: string | null;
    wordCount: number;
    label: Label | null;
    edits: EntryEdit[];
}

export namespace Entry {
    export const TITLE_LENGTH_CUTOFF = 30;

    export enum Flags {
        DELETED = 0b1,
        PINNED = 0b10
    }

    export namespace Flags {
        export const NONE = 0;

        export function toString(flags: number): string {
            const parts: string[] = [];
            if ((flags & Flags.DELETED) !== 0) {
                parts.push('deleted');
            }
            if ((flags & Flags.PINNED) !== 0) {
                parts.push('pinned');
            }
            if (parts.length < 2) {
                return parts[0] || 'none';
            }
            return parts.join(', ');
        }

        export function isDeleted(flags: number): boolean {
            return (flags & Flags.DELETED) !== 0;
        }

        export function setDeleted(flags: number, deleted: boolean): number {
            return deleted ? flags | Flags.DELETED : flags & ~Flags.DELETED;
        }

        export function isPinned(flags: number): boolean {
            return (flags & Flags.PINNED) !== 0;
        }

        export function setPinned(flags: number, pinned: boolean): number {
            return pinned ? flags | Flags.PINNED : flags & ~Flags.PINNED;
        }
    }

    export function isDeleted(self: { flags: number }): boolean {
        return Flags.isDeleted(self.flags);
    }

    export function isPinned(this: void, self: { flags: number }): boolean {
        return Flags.isPinned(self.flags);
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

    export function jsonIsRawEntry(
        json: unknown,
        isEdit = false
    ): json is Omit<Entry, 'id' | 'label'> & {
        label?: string;
    } {
        return (
            typeof json === 'object' &&
            json !== null &&
            'title' in json &&
            typeof json.title === 'string' &&
            'entry' in json &&
            typeof json.entry === 'string' &&
            (!('latitude' in json) ||
                typeof json.latitude === 'number' ||
                json.latitude === null) &&
            (!('longitude' in json) ||
                typeof json.longitude === 'number' ||
                json.longitude === null) &&
            (!('label' in json) || typeof json.label === 'string' || !json.label) &&
            (!('wordCount' in json) || typeof json.wordCount === 'number') &&
            (!('agentData' in json) || typeof json.agentData === 'string') &&
            (!('flags' in json) || typeof json.flags === 'number') &&
            'created' in json &&
            typeof json.created === 'number' &&
            (isEdit ||
                !('edits' in json) ||
                (Array.isArray(json.edits) && json.edits.every(e => Entry.jsonIsRawEntry(e, true))))
        );
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
