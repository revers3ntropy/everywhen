import type { Hours, TimestampSecs } from './types';

export function nowS (): TimestampSecs {
    return Math.floor(Date.now() / 1000);
}

export function fmtTimestampForInput (
    timestamp: TimestampSecs,
    timezoneOffset: Hours = 0,
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
    return Math.floor(Date.parse(timestamp) / 1000) - (new Date().getTimezoneOffset() * 60);
}