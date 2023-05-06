import { fmtUtc } from '$lib/utils/time';
import moment from 'moment';
import type { Entry } from '$lib/controllers/entry';
import { splitText } from '$lib/utils/text';
import type { PickOptionalAndMutable, Seconds } from '../../app';

export type EntryWithWordCount = PickOptionalAndMutable<
    Entry,
    'entry' | 'decrypted' | 'title'
> & {
    wordCount: number;
};

export interface EntryLocation {
    id: string;
    created: number;
    latitude: number | null;
    longitude: number | null;
}

export enum By {
    Words,
    Entries
}

export enum Bucket {
    // hour is a little different in that it only looks at the hour, ignores day
    Hour,
    Day,
    Week,
    Month,
    Year
}

export function bucketiseTime(time: Seconds, bucket: Bucket): Seconds {
    const date = moment(new Date(time * 1000));
    switch (bucket) {
        case Bucket.Hour:
            return parseInt(fmtUtc(time, 0, 'hh'));
        case Bucket.Year:
            return date.startOf('year').unix();
        case Bucket.Month:
            return date.startOf('month').unix();
        case Bucket.Week:
            return date.startOf('week').unix();
        case Bucket.Day:
            return date.startOf('day').unix();
    }
}

export function bucketSize(bucket: Bucket): Seconds {
    switch (bucket) {
        case Bucket.Year:
            return 60 * 60 * 24 * 365;
        case Bucket.Month:
            return 60 * 60 * 24 * 30;
        case Bucket.Week:
            return 60 * 60 * 24 * 7;
        case Bucket.Day:
            return 60 * 60 * 24;
        case Bucket.Hour:
            return 60 * 60;
    }
}

export function commonWordsFromText(
    txt: string,
    words: Record<string, number> = {}
): Record<string, number> {
    for (let word of splitText(txt)) {
        word = word.toLowerCase();
        words[word] ??= 0;
        words[word]++;
    }
    return words;
}
