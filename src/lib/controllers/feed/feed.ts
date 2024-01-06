import type { Entry } from '$lib/controllers/entry/entry';
import { Event } from '$lib/controllers/event/event';

export type FeedItemTypes = {
    eventEnd: {
        type: 'event-end';
        id: string;
        start: number;
        end: number;
        tzOffset: number;
        labelId: string;
        nameEncrypted: string;
    };
    eventStart: {
        type: 'event-start';
        id: string;
        start: number;
        end: number;
        tzOffset: number;
        labelId: string;
        nameEncrypted: string;
    };
    sleep: {
        type: 'sleep';
        id: string;
        start: number;
        startTzOffset: number;
        duration: number;
        quality: number | null;
        regularity: number | null;
    };
    entry: { type: 'entry' } & Entry;
    entryEdit: {
        type: 'entry-edit';
        id: string;
        entryId: string;
        created: number;
        createdTzOffset: number;
        latitude: number | null;
        longitude: number | null;
        agentData: string;
        titleShortened: string;
        bodyShortened: string;
    };
};

export type FeedItem = FeedItemTypes[keyof FeedItemTypes];

export interface FeedDay {
    day: string;
    items: FeedItem[];
    happiness: number | null;
    nextDayInPast: string | null;
    nextDayInFuture: string | null;
}

export interface Feed {
    [k: string]: FeedDay;
}

export namespace Feed {
    export function feedItemTime(item: FeedItem): number {
        switch (item.type) {
            case 'entry':
            case 'entry-edit':
                return item.created;
            case 'sleep':
            case 'event-start':
                return item.start;
            case 'event-end':
                // put the end of instant events after the start
                // as events are instant if they are less than 60
                // seconds long, shouldn't make a difference...
                // TODO order properly
                return item.end + (Event.isInstantEvent(item) ? 1 : 0);
        }
    }

    export function orderedFeedItems(items: FeedItem[]): FeedItem[] {
        return [...items].sort((a, b) => {
            return feedItemTime(b) - feedItemTime(a);
        });
    }
}
