import type { Seconds } from './types';

export function nowS (): Seconds {
    return Math.floor(Date.now() / 1000);
}

export function fmtTimestampForInput (timestamp: Seconds): string {
    return new Date(timestamp * 1000)
        .toISOString()
        .split('.')[0];
}

export function parseTimestampFromInput (timestamp: string): Seconds {
    return Math.floor(Date.parse(timestamp) / 1000);
}