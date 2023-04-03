import moment from 'moment';
import type { Hours, Seconds, TimestampSecs } from './types';

/**
 * Get the UTC timestamp of now in seconds
 * @returns {TimestampSecs}
 */
export function nowS (): TimestampSecs {
    return Math.floor(Date.now() / 1000);
}

export function currentTzOffset (): Hours {
    return -(new Date().getTimezoneOffset() / 60);
}

export function fmtUtc (
    timestamp: TimestampSecs,
    tzOffset: Hours,
    fmt: string,
): string {
    return moment(new Date((timestamp + tzOffset * 60 * 60) * 1000))
        .utc()
        .format(fmt);
}

export function fmtDuration (time: Seconds): string {
    return moment.duration(time, 's')
                 .humanize();
}

export function fmtTimestampForInput (
    timestamp: TimestampSecs,
    timezoneOffset: Hours = currentTzOffset(),
    roundToMinute = true,
): string {
    if (roundToMinute) {
        timestamp -= timestamp % 60;
    }
    timestamp += timezoneOffset * 60 * 60;
    return new Date(timestamp * 1000)
        .toISOString()
        .split('.')[0];
}

export function parseTimestampFromInputUtc (timestamp: string): TimestampSecs {
    return Math.floor(Date.parse(timestamp) / 1000);
}

export function dayUtcFromTimestamp (
    timestamp: TimestampSecs,
    tzOffset: Hours = currentTzOffset(),
): TimestampSecs {
    const day = fmtUtc(timestamp, tzOffset, 'YYYY-MM-DD');
    return new Date(`${day}T12:00:00Z`).getTime() / 1000;
}

export function utcEq (
    a: TimestampSecs,
    b: TimestampSecs,
    fmt='YYYY-MM-DD',
    tzOffset: Hours = currentTzOffset(),
): boolean {
    return fmtUtc(a, tzOffset, fmt) === fmtUtc(b, tzOffset, fmt);
}