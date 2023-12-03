import { Entry } from '$lib/controllers/entry/entry';
import type { Event } from '$lib/controllers/event/event';

export type FeedItem =
    | (Entry & { type: 'entry' })
    | {
          id: string;
          type: 'sleep';
          start: number;
          startTzOffset: number;
          duration: number;
          quality: number | null;
          regularity: number | null;
      }
    | (Event & { type: 'event-start' })
    | (Event & { type: 'event-end' });

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
    export function feedItemTime(item: FeedItem): number {
        switch (item.type) {
            case 'entry':
                return Entry.localTime(item);
            case 'sleep':
                return item.start + item.startTzOffset * 60 * 60;
            case 'event-start':
                return item.start;
            case 'event-end':
                return item.end;
        }
    }

    export function orderedFeedItems(items: FeedItem[]): FeedItem[] {
        return [...items].sort((a, b) => {
            return feedItemTime(b) - feedItemTime(a);
        });
    }
}
