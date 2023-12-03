import type { Entry } from '$lib/controllers/entry/entry.server';

export type FeedItem = Entry & { type: 'entry' };

export interface FeedDay {
    day: string;
    items: FeedItem[];
    happiness: number | null;
    nextDayInPast: string | null;
}

export interface Feed {
    [k: string]: FeedDay;
}

export namespace Feed {
    export function orderedFeedItems(items: FeedItem[]): FeedItem[] {
        return [...items].sort((a, b) => b.created - a.created);
    }
}
