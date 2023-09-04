import { query } from '$lib/db/mysql.server';
import { roundToDecimalPlaces } from '$lib/utils/text';
import type { Milliseconds, TimestampSecs } from '../../../types';

export interface PageLoadLog {
    created: TimestampSecs;
    method: string;
    url: string;
    route: string;
    responseTimeMs: Milliseconds;
    responseCode: number;
    userId: string;
    userAgent: string;
    requestSize: number;
    resultSize: number;
    ipAddress: string;
}

export namespace PageLoadLog {
    export async function createLog(log: PageLoadLog) {
        await query.unlogged`
            INSERT INTO pageLoads (
                userId, created, method, url, route, loadTimeMs, responseCode,
                userAgent, requestSize, responseSize, ipAddress
            ) VALUES (
                ${log.userId},
                ${log.created},
                ${log.method},
                ${log.url},
                ${log.route},
                ${roundToDecimalPlaces(log.responseTimeMs, 3)},
                ${log.responseCode},
                ${log.userAgent},
                ${log.requestSize},
                ${log.resultSize},
                ${log.ipAddress}
          )
        `;
    }
}
