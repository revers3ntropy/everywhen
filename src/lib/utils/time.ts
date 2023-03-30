import type { TimestampSecs } from './types';

export function nowS (): TimestampSecs {
    return Math.floor(Date.now() / 1000);
}

export function fmtTimestampForInput (timestamp: TimestampSecs): string {
    return new Date(timestamp * 1000)
        .toISOString()
        .split('.')[0];
}

export function parseTimestampFromInputUtc (timestamp: string): TimestampSecs {
    return Math.floor(Date.parse(timestamp) / 1000) - (new Date().getTimezoneOffset() * 60);
}