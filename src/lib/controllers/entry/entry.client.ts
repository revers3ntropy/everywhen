import { fmtUtc } from '$lib/utils/time';
import type { Entry as _Entry } from './entry';
export type Entry = _Entry;

namespace EntryUtils {
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
            (!('agentData' in json) || typeof json.agentData === 'string' || !json.agentData) &&
            (!('flags' in json) || typeof json.flags === 'number') &&
            'created' in json &&
            typeof json.created === 'number' &&
            (isEdit ||
                !('edits' in json) ||
                (Array.isArray(json.edits) && json.edits.every(e => Entry.jsonIsRawEntry(e, true))))
        );
    }

    function stringToShortTitle(str: string): string {
        return str
            .replace(/[^0-9a-zA-Z#_\-!?:| ]/gi, ' ')
            .replace(/ +/gi, ' ')
            .substring(0, TITLE_LENGTH_CUTOFF);
    }

    export function entryToTitleEntry(this: void, entry: Entry): Entry {
        return {
            ...entry,
            title: stringToShortTitle(entry.title),
            entry: stringToShortTitle(entry.entry)
        };
    }
}

export const Entry = EntryUtils;
