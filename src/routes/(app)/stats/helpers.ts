import { wordsFromText } from '$lib/utils/text';

export enum By {
    Words,
    Entries
}

export enum Bucket {
    // hour is a little different in that it only looks at the hour, ignores day
    Hour = 'Hour',
    Day = 'Day',
    Week = 'Week',
    Month = 'Month',
    Year = 'Year',
    OperatingSystem = 'Operating System'
}

export const bucketNames: Record<string, Bucket> = {
    Year: Bucket.Year,
    Month: Bucket.Month,
    Week: Bucket.Week,
    Day: Bucket.Day,
    Hour: Bucket.Hour,
    'Operating System': Bucket.OperatingSystem
};

export function initialBucket(days: number): Bucket {
    if (days < 7 + 3) return Bucket.Day;
    if (days < 7 * 14) return Bucket.Week;
    if (days < 365 * 10) return Bucket.Month;
    return Bucket.Year;
}

export function initialBucketName(days: number): string {
    return initialBucket(days);
}

export function commonWordsFromText(
    txt: string,
    words: Record<string, number> = {}
): Record<string, number> {
    for (const word of wordsFromText(txt)) {
        const lowercase = word.toLowerCase();
        words[lowercase] ??= 0;
        words[lowercase]++;
    }
    return words;
}
