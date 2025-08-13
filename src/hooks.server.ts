import { COOKIE_KEYS } from '$lib/constants';
import { sessionCookieOptions } from '$lib/utils/cookies';
import type { Cookies, Handle, RequestEvent } from '@sveltejs/kit';
import { cleanupCache } from '$lib/utils/cache.server';
import { Auth } from '$lib/controllers/auth/auth.server';
import type { MaybePromise, Mutable } from './types';
import { SSLogger } from '$lib/controllers/logs/logs.server';

// makes time zone offset always 0
process.env.TZ = 'Etc/UTC';

const reqLogger = new SSLogger('Request');
const processLogger = new SSLogger('Process');

setInterval(() => {
    try {
        cleanupCache();
    } catch (error) {
        void processLogger.log('Failed to cleanup cache', { error });
    }
}, 1000 * 60);

process.on('exit', exitHandler);
process.on('SIGINT', exitHandler);
process.on('SIGTERM', exitHandler);
process.on('SIGUSR1', exitHandler);
process.on('SIGUSR2', exitHandler);
process.on('uncaughtException', (...args) => {
    void processLogger.log(`Uncaught Exception`, { args });
});

function exitHandler(...args: unknown[]) {
    void processLogger.log(`Exited!`, { args }).then(() => {
        process.exit();
    });
}

function getCookieWritableCookies(cookies: Cookies): App.Locals['__cookieWritables'] {
    const result = {} as Mutable<App.Locals['__cookieWritables']>;

    const cookieKeys = COOKIE_KEYS;
    const keyToNameMap = Object.fromEntries(
        (Object.keys(cookieKeys) as (keyof typeof cookieKeys)[]).map(key => [cookieKeys[key], key])
    );

    for (const { name, value } of cookies.getAll()) {
        if (name in keyToNameMap) {
            result[keyToNameMap[name]] = value;
        }
    }

    delete result.sessionId;

    return result as App.Locals['__cookieWritables'];
}

function getIp(req: RequestEvent): string {
    let ip = '';

    // might be set by the apache reverse proxy
    const xForwardHeader = req.request.headers.get('x-forwarded-for');
    if (xForwardHeader) ip = xForwardHeader;

    const cfConnectingIpHeader = req.request.headers.get('cf-connecting-ip');
    if (!ip && cfConnectingIpHeader) ip = cfConnectingIpHeader;

    if (ip) return ip;
    try {
        return req.getClientAddress() || '0';
    } catch (_) {
        return '0';
    }
}

export const handle = (async ({ event, resolve }) => {
    const start = performance.now();

    // has already been cloned, 'auth' is not a reference to the stored object
    const auth = Auth.tryGetAuthFromCookies(event.cookies);
    event.locals.auth = auth;
    if (!auth && event.cookies.get(COOKIE_KEYS.sessionId)) {
        // unset session cookie if invalid session
        event.cookies.delete(COOKIE_KEYS.sessionId, sessionCookieOptions(false));
    }

    event.locals.__cookieWritables = getCookieWritableCookies(event.cookies);

    let res: MaybePromise<Response>;
    try {
        res = await resolve(event);
    } catch (error) {
        const end = performance.now();
        // don't log user keys!
        if (event.locals.auth) event.locals.auth.key = 'REDACTED';
        await reqLogger.error('page load error', {
            error,
            event,
            loadTimeMs: end - start
        });
        return new Response('An Error has Occurred', {
            status: 500
        });
    }

    const end = performance.now();

    const ipAddress = getIp(event);
    const routeId = event.route.id;
    if (routeId === '/api/version') {
        // don't log api version requests, as they are just spam -
        // downtimeMonitor and all active clients poll this endpoint
        return res;
    }
    void reqLogger.withUserId(auth ? auth.id : null).log('page load', {
        url: event.url,
        routeId,
        method: event.request.method,
        loadTimeMs: end - start,
        responseCode: res.status,
        requestSize: String(event.request.body).length,
        responseSize: String(res.body).length,
        ipAddress,
        userAgent: event.request.headers.get('user-agent') || ''
    });

    return res;
}) satisfies Handle;
