import * as client from './entry.client';
import * as server from './entry.server';
import type { Label } from './label';

export interface EntryLocation {
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
}

export interface Streaks {
    current: number;
    longest: number;
    runningOut: boolean;
}

// RawEntry is the raw data from the database,
// Entry is the data after decryption and links to labels
export type RawEntry = Omit<Entry, 'label'> & {
    label?: string;
};

export type EntryEdit = Omit<Entry, 'edits'> & { entryId?: string };

export interface Entry {
    id: string;
    title: string;
    entry: string;
    created: TimestampSecs;
    createdTZOffset: Hours;
    flags: number;
    latitude: number | null;
    longitude: number | null;
    agentData: string | undefined;
    label?: Label;
    edits?: EntryEdit[];
}

export const Entry = {
    ...server.Entry,
    ...client.Entry
};
