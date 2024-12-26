export enum By {
    Words = 'by-words',
    Entries = 'by-entries'
}

export enum Grouping {
    // hours 0-23 ignoring date
    Hour = 'Hour',
    Day = 'Day',
    // days 0-6 ignoring date
    DayOfWeek = 'Day of Week',
    Week = 'Week',
    Month = 'Month',
    Year = 'Year',
    // OS that it was created on
    OperatingSystem = 'Operating System'
}

export type StatsData = {
    labels: string[];
    values: Record<By, number[]>;
};

export namespace Stats {
    export function groupingFromString(str: string): Grouping | null {
        switch (str.toLowerCase()) {
            case 'hour':
                return Grouping.Hour;
            case 'day':
                return Grouping.Day;
            case 'dayofweek':
            case 'day of week':
                return Grouping.DayOfWeek;
            case 'week':
                return Grouping.Week;
            case 'month':
                return Grouping.Month;
            case 'year':
                return Grouping.Year;
            case 'operatingsystem':
            case 'operating system':
                return Grouping.OperatingSystem;
            default:
                throw new Error('Invalid grouping');
        }
    }
}
