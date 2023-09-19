export type HeatMapData = { date: Date; value: number }[];

export interface EntryStats {
    created: number;
    createdTzOffset: number;
    wordCount: number;
    agentData: string;
}

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

export function heatMapDataFromEntries(entries: EntryStats[]): Record<By, HeatMapData> {
    return {
        [By.Words]: entries.map(entry => ({
            date: new Date(entry.created * 1000),
            value: entry.wordCount
        })),
        [By.Entries]: entries.map(entry => ({
            date: new Date(entry.created * 1000),
            value: By.Entries
        }))
    };
}
