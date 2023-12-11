import moment from 'moment';
import { PUBLIC_ENV } from '$env/static/public';
import { DEV_USE_TZ_OFFSET_0 } from '$lib/constants';
import { browser } from '$app/environment';
import type { Hours, Seconds, TimestampSecs } from '../../types';
import { Result } from '$lib/utils/result';

moment.updateLocale('en', {
    relativeTime: {
        future: 'in %s',
        past: '%s ago',
        s: '1s',
        ss: '%ds',
        m: '1m',
        mm: '%dm',
        h: '1h',
        hh: '%dh',
        d: '1d',
        dd: '%dd',
        M: '1mo',
        MM: '%dmo',
        y: '1y',
        yy: '%dy'
    }
});

moment.updateLocale('en-full', {
    relativeTime: {
        future: '%s',
        past: '%s',
        s: 'a second',
        ss: '%d seconds',
        m: 'a minute',
        mm: '%d minutes',
        h: 'a hour',
        hh: '%d hours',
        d: 'a day',
        dd: '%d days',
        M: 'a month',
        MM: '%d months',
        y: 'a year',
        yy: '%d years'
    }
});

/**
 * Get the UTC timestamp of now in seconds
 * @returns {TimestampSecs}
 */
export function nowUtc(rounded = true): TimestampSecs {
    const s = Date.now() / 1000;
    return rounded ? Math.floor(s) : s;
}

export function currentTzOffset(): Hours {
    if (!browser) return 0;
    if (PUBLIC_ENV === 'dev' && DEV_USE_TZ_OFFSET_0) return 0;
    return -(new Date().getTimezoneOffset() / 60);
}

export function fmtUtc(timestamp: TimestampSecs, tzOffset: Hours, fmt: string): string {
    return moment(new Date((timestamp + tzOffset * 60 * 60) * 1000))
        .utc()
        .format(fmt);
}

export function fmtDuration(time: Seconds): string {
    return moment.duration(time, 's').humanize();
}

export function fmtDurationHourMin(time: Seconds): string {
    const m = moment.duration(time, 's');
    return `${m.hours()}h ${m.minutes()}m`;
}

export function fmtUtcRelative(timestamp: TimestampSecs | Date, locale = 'en'): string {
    if (timestamp instanceof Date) {
        timestamp = Math.floor(timestamp.getTime() / 1000);
    }
    return moment(timestamp * 1000)
        .utc()
        .locale(locale)
        .fromNow();
}

export function fmtTimestampForInput(
    timestamp: TimestampSecs,
    timezoneOffset: Hours,
    roundToMinute = true
): string {
    if (roundToMinute) {
        timestamp -= timestamp % 60;
    }
    timestamp += timezoneOffset * 60 * 60;
    return new Date(timestamp * 1000).toISOString().split('.')[0];
}

export function parseTimestampFromInputUtc(timestamp: string): TimestampSecs {
    return Math.floor(Date.parse(timestamp) / 1000);
}

export function dayUtcFromTimestamp(timestamp: TimestampSecs, tzOffset: Hours): TimestampSecs {
    const day = fmtUtc(timestamp, tzOffset, 'YYYY-MM-DD');
    return new Date(`${day}T12:00:00Z`).getTime() / 1000;
}

export function utcEq(
    a: TimestampSecs,
    b: TimestampSecs,
    aTzOffset: Hours,
    bTzOffset: Hours,
    fmt: string
): boolean {
    return fmtUtc(a, aTzOffset, fmt) === fmtUtc(b, bTzOffset, fmt);
}

/**
 * Get the number of days since the given timestamp
 * Always returns at least 1
 */
export function daysSince(timestamp: TimestampSecs, tzOffset: Hours): number {
    const today = dayUtcFromTimestamp(nowUtc(), tzOffset);
    const then = dayUtcFromTimestamp(timestamp, tzOffset);
    if (then > today) {
        return 1;
    }
    return Math.floor((today - then) / (60 * 60 * 24)) + 1;
}

export class Day {
    public constructor(
        public readonly year: number,
        public readonly month: number,
        public readonly date: number
    ) {}

    public static fromTimestamp(timestamp: TimestampSecs, tzOffset: Hours): Day {
        const date = new Date((timestamp + tzOffset * 60 * 60) * 1000);
        return new Day(date.getFullYear(), date.getMonth() + 1, date.getDate());
    }

    public static today(tzOffset: Hours): Day {
        return Day.fromTimestamp(nowUtc(), tzOffset);
    }

    public static fromString(str: string): Result<Day> {
        const parts = str.split('-');
        if (parts.length !== 3) {
            return Result.err('Invalid day format');
        }
        const [year, month, date] = parts.map(Number);
        if (isNaN(year) || isNaN(month) || isNaN(date)) {
            return Result.err('Invalid day format');
        }
        if (year < 1000 || year > 9999) {
            return Result.err('Invalid year');
        }
        if (month < 1 || month > 12) {
            return Result.err('Invalid month');
        }
        if (date < 1 || date > 31) {
            return Result.err('Invalid date');
        }
        return Result.ok(new Day(year, month, date));
    }

    public fmtIso(): string {
        return `${this.year}-${this.month.toString().padStart(2, '0')}-${this.date
            .toString()
            .padStart(2, '0')}`;
    }

    public utcTimestamp(tzOffset: Hours): TimestampSecs {
        return new Date(`${this.fmtIso()}T12:00:00Z`).getTime() / 1000 - tzOffset * 60 * 60;
    }

    public eq(other: Day): boolean {
        return this.year === other.year && this.month === other.month && this.date === other.date;
    }

    public lt(other: Day): boolean {
        if (this.year < other.year) return true;
        if (this.year > other.year) return false;
        if (this.month < other.month) return true;
        if (this.month > other.month) return false;
        return this.date < other.date;
    }

    public plusDays(days: number): Day {
        const date = new Date(`${this.fmtIso()}T12:00:00Z`);
        date.setDate(date.getDate() + days);
        return Day.fromTimestamp(date.getTime() / 1000, currentTzOffset());
    }
}
