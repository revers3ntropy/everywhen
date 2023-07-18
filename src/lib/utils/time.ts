import moment from 'moment';
import { PUBLIC_ENV } from "$env/static/public";
import { DEV_USE_TZ_OFFSET_0 } from "$lib/constants";
import { browser } from "$app/environment";

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

export function dayUtcFromTimestamp(
    timestamp: TimestampSecs,
    tzOffset: Hours
): TimestampSecs {
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
