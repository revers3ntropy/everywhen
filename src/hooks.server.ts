import { PageLoadLog } from '$lib/controllers/log';
import { tryGetAuthFromCookies } from '$lib/security/getAuthFromCookies';
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

async function logReq(
    duration: Milliseconds,
    now: TimestampSecs,
    req: RequestEvent,
    res: Response
): Promise<void> {
    const path = req.route.id || '[unknown]';

    void reqLogger.logToFile(req.request.method, path);

    const auth = await tryGetAuthFromCookies(req.cookies);
    const userId = (auth?.id || 0).toString();

    await PageLoadLog.createLog(
        query,
        now,
        req.request.method,
        req.url.href,
        (req.route.id as string) || '[unknown]',
        duration,
        res.status,
        userId,
        req.request.headers.get('user-agent') || '',
        (
            await req.request.text()
        ).length,
        (
            await res.text()
        ).length
    );
}

export const handle = (async ({ event, resolve }) => {
    const start = performance.now();
    const now = nowUtc();

    const eventClone: RequestEvent = {
        ...event,
        request: event.request.clone()
    };

    let result: Response;
    try {
        result = await resolve(event);
    } catch (e) {
        void errorLogger.logToFile(e);
        result = new Response('An Error has Occurred', {
            status: 500
        });
    }

    void logReq(performance.now() - start, now, eventClone, result.clone());

    return result;
}) satisfies Handle;
