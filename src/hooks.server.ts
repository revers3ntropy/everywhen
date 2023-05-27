import { PageLoadLog } from '$lib/controllers/log';
import { nowUtc } from '$lib/utils/time';
import type { Handle, RequestEvent } from '@sveltejs/kit';
import chalk from 'chalk';
import { connect, dbConnection, query } from '$lib/db/mysql';
import { cleanupCache } from '$lib/utils/cache';
import { errorLogger, makeLogger } from '$lib/utils/log';
import type { Milliseconds, TimestampSecs } from './app';

const reqLogger = makeLogger('REQ', chalk.grey, 'general.log');

// keep connection to database alive
// so it's not re-connected on API request
setInterval(() => {
    if (!dbConnection) {
        void connect();
        return;
    }
    void dbConnection?.ping();
}, 1000 * 60);

setInterval(cleanupCache, 1000 * 60);

function exitHandler(...args: unknown[]) {
    void errorLogger.logToFile(`Exited!`, ...args).then(() => {
        process.exit();
    });
}

process.on('exit', exitHandler);
process.on('SIGINT', exitHandler);
process.on('SIGTERM', exitHandler);
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);
process.on('uncaughtException', exitHandler);

function logReq(
    startPerf: Milliseconds,
    now: TimestampSecs,
    status: number,
    event: RequestEvent
) {
    const time = performance.now() - startPerf;
    const path = event.route.id || '[unknown]';

    void reqLogger.logToFile(event.request.method, path);

    void PageLoadLog.createLog(
        query,
        now,
        event.request.method,
        event.url.href,
        (event.route.id as string) || '[unknown]',
        time,
        status,
        '',
        event.request.headers.get('user-agent') || ''
    );
}

export const handle = (async ({ event, resolve }) => {
    const start = performance.now();
    const now = nowUtc();
    let result: Response;
    try {
        result = await resolve(event);
    } catch (e) {
        void errorLogger.logToFile(e);
        result = new Response('An Error has Occurred', {
            status: 500
        });
    }
    logReq(start, now, result.status, event);

    return result;
}) satisfies Handle;
