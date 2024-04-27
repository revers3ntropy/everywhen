import moment from 'moment';
import type { Hours, Seconds, TimestampSecs } from '../../types';

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
    return 4;
    //return -(new Date().getTimezoneOffset() / 60);
}

export function fmtUtc(timestamp: TimestampSecs, tzOffset: Hours, fmt: string): string {
    return moment((timestamp + tzOffset * 60 * 60) * 1000)
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
    if (then > today) return 1;
    return Math.floor((today - then) / (60 * 60 * 24)) + 1;
}
