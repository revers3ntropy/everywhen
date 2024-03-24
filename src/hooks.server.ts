import { COOKIE_KEYS } from '$lib/constants';
import { sessionCookieOptions } from '$lib/utils/cookies';
import type { Cookies, Handle } from '@sveltejs/kit';
import chalk from 'chalk';
import { cleanupCache } from '$lib/utils/cache.server';
import { FileLogger } from '$lib/utils/log.server';
import { Auth } from '$lib/controllers/auth/auth.server';
import type { Mutable } from './types';

const reqLogger = new FileLogger('REQ', chalk.bgWhite.black);
const processLogger = new FileLogger('PROC', chalk.black.bgRedBright);

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

export const handle = (async ({ event, resolve }) => {
    const auth = Auth.tryGetAuthFromCookies(event.cookies);
    if (auth) {
        event.locals.auth = { ...auth };
    } else {
        event.locals.auth = null;

        if (event.cookies.get(COOKIE_KEYS.sessionId)) {
            // unset session cookie if invalid session
            event.cookies.delete(COOKIE_KEYS.sessionId, sessionCookieOptions(false));
        }
    }

    event.locals.__cookieWritables = getCookieWritableCookies(event.cookies);

    let result: Response;
    try {
        result = await resolve(event);
    } catch (error) {
        void reqLogger.error('Uncaught error when resolving response', { error, event });
        result = new Response('An Error has Occurred', {
            status: 500
        });
    }

    return result;
}) satisfies Handle;
