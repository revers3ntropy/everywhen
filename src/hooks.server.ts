import { COOKIE_WRITEABLE_KEYS } from '$lib/constants';
import { Log } from '$lib/controllers/log/log';
import type { Auth } from '$lib/controllers/user/user';
import { tryGetAuthFromCookies } from '$lib/security/getAuthFromCookies';
import { nowUtc } from '$lib/utils/time';
import type { Cookies, Handle, RequestEvent } from '@sveltejs/kit';
import chalk from 'chalk';
import { connect, dbConnection, query } from '$lib/db/mysql';
import { cleanupCache } from '$lib/utils/cache';
import { errorLogger, makeLogger } from '$lib/utils/log';

const reqLogger = makeLogger('REQ', chalk.bgWhite.black, 'general.log');

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

function getIp(req: RequestEvent): string {
    let ip = '';

    // might be set by the apache reverse proxy
    const xForwardHeader = req.request.headers.get('x-forwarded-for');
    if (xForwardHeader) ip = xForwardHeader;

    const cfConnectingIpHeader = req.request.headers.get('cf-connecting-ip');
    if (!ip && cfConnectingIpHeader) ip = cfConnectingIpHeader;

    if (!ip) {
        try {
            ip = req.getClientAddress();
        } catch (e) {
            ip = '[unknown]';
        }
    }

    return ip || '[unknown]';
}

async function logReq(
    duration: Milliseconds,
    now: TimestampSecs,
    req: RequestEvent,
    res: Response,
    auth: Auth | null
): Promise<void> {
    const path = req.route.id || '[unknown]';

    void reqLogger.logToFile(req.request.method, req.url.href);

    const userId = (auth?.id || '').toString();

    const ip = getIp(req);

    await Log.PageLoadLog.createLog(
        query.unlogged,
        now,
        req.request.method,
        req.url.href,
        path,
        duration,
        res.status,
        userId,
        req.request.headers.get('user-agent') || '',
        (
            await req.request.text()
        ).length,
        (
            await res.text()
        ).length,
        ip
    );
}

function getCookieWritableCookies(cookies: Cookies): App.Locals['__cookieWritables'] {
    const result = {} as Mutable<App.Locals['__cookieWritables']>;

    const cookieKeys = COOKIE_WRITEABLE_KEYS;
    const keyToNameMap = Object.fromEntries(
        (Object.keys(cookieKeys) as (keyof typeof cookieKeys)[]).map(key => [cookieKeys[key], key])
    );

    for (const { name, value } of cookies.getAll()) {
        if (name in keyToNameMap) {
            result[keyToNameMap[name]] = value;
        }
    }

    return result as App.Locals['__cookieWritables'];
}

export const handle = (async ({ event, resolve }) => {
    const start = performance.now();
    const now = nowUtc();

    const auth = await tryGetAuthFromCookies(event.cookies);
    if (auth) {
        event.locals.auth = { ...auth };
    } else {
        event.locals.auth = null;
    }

    event.locals.__cookieWritables = getCookieWritableCookies(event.cookies);

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

    void logReq(performance.now() - start, now, eventClone, result.clone(), auth).catch(
        errorLogger.error
    );

    return result;
}) satisfies Handle;
