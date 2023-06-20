import type { QueryFunc } from '$lib/db/mysql';
import { roundNDP } from '$lib/utils/text';
import type { Milliseconds, TimestampSecs } from '../../app';

export class PageLoadLog {
    public static async createLog(
        query: QueryFunc,
        created: TimestampSecs,
        method: string,
        url: string,
        route: string,
        responseTimeMs: Milliseconds,
        responseCode: number,
        userId: string,
        userAgent: string,
        requestSize: number,
        resultSize: number,
        ipAddress: string
    ) {
        await query`
            INSERT INTO pageLoads (
                user, created, method, url, 
                route, loadTimeMs, responseCode,
                userAgent, requestSize, responseSize,
                ipAddress
            ) VALUES (
                      ${userId},
                      ${created},
                      ${method},
                      ${url},
                      ${route},
                      ${roundNDP(responseTimeMs, 3)},
                      ${responseCode},
                      ${userAgent},
                      ${requestSize},
                      ${resultSize},
                      ${ipAddress}
          )
        `;
    }
}
