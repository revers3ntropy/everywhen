import type { Entry } from '$lib/controllers/entry/entry.server';

export interface FeedDay {
    day: string;
    entries: Entry[];
    happiness: number | null;
    nextDayInPast: string | null;
}

export interface Feed {
    [k: string]: FeedDay;
}

export namespace Feed {}
