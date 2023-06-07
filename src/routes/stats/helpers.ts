import type { Entry } from '$lib/controllers/entry';
import { splitText } from '$lib/utils/text';
import type { PickOptionalAndMutable } from '../../app';

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
    Year,
    OperatingSystem
}

export const bucketNames: Record<string, Bucket> = {
    Year: Bucket.Year,
    Month: Bucket.Month,
    Week: Bucket.Week,
    Day: Bucket.Day,
    Hour: Bucket.Hour,
    'Operating System': Bucket.OperatingSystem
};

const bucketToNameMap: Record<Bucket, string> = {
    [Bucket.Hour]: 'Hour',
    [Bucket.Day]: 'Day',
    [Bucket.Week]: 'Week',
    [Bucket.Month]: 'Month',
    [Bucket.Year]: 'Year',
    [Bucket.OperatingSystem]: 'Operating System'
};

export function initialBucket(days: number): Bucket {
    if (days < 10) return Bucket.Day;
    if (days < 100) return Bucket.Week;
    if (days < 5000) return Bucket.Month;
    return Bucket.Year;
}

export function initialBucketName(days: number): string {
    return bucketToNameMap[initialBucket(days)];
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
