import { Entry } from '$lib/controllers/entry/entry';

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
      };

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
        }
    }

    export function orderedFeedItems(items: FeedItem[]): FeedItem[] {
        return [...items].sort((a, b) => {
            return feedItemTime(b) - feedItemTime(a);
        });
    }
}
