import type { HttpError, RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import chalk from 'chalk';
import type { Auth } from '../controllers/user';
import { getAuthFromCookies } from '../security/getAuthFromCookies';
import type { GenericResponse } from './apiResponse';
import { makeLogger } from './log';
import { fmtBytes } from './text';
import { nowS } from './time';
import type { Bytes, Seconds } from './types';

const cacheLogger = makeLogger('CACHE', chalk.magentaBright, 'cache.log');
cacheLogger.logToFile('Initialised');

const cache: Record<string, Record<string, unknown>> = {};
const cacheLastUsed: Record<string, number> = {};

function roughSizeOfObject (object: unknown): number {
    let objectList: any[] = [];
    let stack: any[] = [ object ];
    let bytes = 0;

    while (stack.length) {
        const value = stack.pop();

        if (typeof value === 'boolean') {
            bytes += 4;
        } else if (typeof value === 'string') {
            bytes += value.length * 2;
        } else if (typeof value === 'number') {
            bytes += 8;
        } else if
        (
            typeof value === 'object'
            && objectList.indexOf(value) === -1
        ) {
            objectList.push(value);

            for (const i in value) {
                stack.push(value[i]);
            }
        }
    }
    return bytes;
}

export function cacheResponse<T> (
    url: string,
    userId: string,
    response: T,
): void {
    cache[userId] = cache[userId] || {};
    cache[userId][url] = response;
    cacheLastUsed[userId] = nowS();
}

export function getCachedResponse<T> (
    url: string,
    userId: string,
): T | undefined {
    cacheLastUsed[userId] = nowS();
    if (cache[userId]?.hasOwnProperty(url)) {
        cacheLogger.log(`${chalk.green('HIT')}  ${new URL(url).pathname}`);
        return cache[userId][url] as T;
    } else {
        cacheLogger.log(`${chalk.red('MISS')} ${new URL(url).pathname}`);
        return undefined;
    }
}

export function invalidateCache (userId: string): void {
    delete cache[userId];
    delete cacheLastUsed[userId];
}

export function cleanupCache (): number {
    const now = nowS();
    const cacheSize = roughSizeOfObject(cache);
    const timeout = cacheTimeout(cacheSize);

    const bytesFmt = chalk.yellow(fmtBytes(cacheSize));
    let cleared = 0;

    for (const userId of Object.keys(cacheLastUsed)) {
        const timeSinceLastUsed = now - cacheLastUsed[userId];
        if (timeSinceLastUsed > timeout) {
            invalidateCache(userId);
            cleared++;
        }
    }

    const cacheSizeAfter = roughSizeOfObject(cache);
    const changeFmt = chalk.yellow(fmtBytes(cacheSizeAfter - cacheSize));
    cacheLogger.logToFile(
        chalk.yellow('CLEANUP'),
        `size=${bytesFmt}`,
        `timeout=${timeout}s`,
        `change=${changeFmt}`,
        `(${cleared})`,
    );
    return cacheSizeAfter;
}

export function cacheTimeout (size: Bytes): Seconds {
    if (size < 1_000_000) {
        return 60 * 60 * 24 * 7; // 1 week
    } else if (size < 50_000_000) {
        return 60 * 60 * 24; // 1 day
    } else if (size < 500_000_000) {
        return 60 * 5; // 5 minutes
    }
    return 0; // clear cache completely when above 500MB
}

export function cachedApiRoute<
    Params extends Partial<Record<string, string>>,
    RouteId extends string | null,
    Res extends {},
> (
    handler: (
        auth: Auth,
        event: RequestEvent<Params, RouteId>,
    ) => Promise<Res>,
): (event: RequestEvent<Params, RouteId>) => Promise<GenericResponse<Res>> {
    return (async (props: RequestEvent<Params, RouteId>): Promise<GenericResponse<Res>> => {
        const url = props.url.href;
        const auth = await getAuthFromCookies(props.cookies);
        const cached = getCachedResponse<Response>(url, auth.id)?.clone();
        if (cached) {
            return cached as GenericResponse<Res>;
        }
        const response = await handler(auth, props);
        if (typeof response !== 'object') {
            throw new Error('Body must be an object');
        }
        if (Array.isArray(response)) {
            throw new Error('Body must not be an array');
        }
        const responseString = JSON.stringify(response);
        const responseObj = new Response(
            responseString,
            { status: 200 },
        ) as GenericResponse<Res>;
        cacheResponse(url, auth.id, responseObj.clone());
        return responseObj;
    }) satisfies (event: RequestEvent<Params, RouteId>) => Promise<GenericResponse<Res>>;
}

export function cachedPageRoute<
    Params extends Partial<Record<string, string>>,
    ParentData extends Record<string, any>,
    OutputData extends Record<string, any> | void,
    RouteId extends string | null
> (
    handler: (
        auth: Auth,
        event: ServerLoadEvent<Params, ParentData, RouteId>,
    ) => Promise<HttpError | OutputData>,
): (event: ServerLoadEvent<Params, ParentData, RouteId>) => Promise<HttpError | OutputData> {
    return (async (props: ServerLoadEvent<Params, ParentData, RouteId>): Promise<HttpError | OutputData> => {
        const url = props.url.href;
        const auth = await getAuthFromCookies(props.cookies);
        const cached = getCachedResponse(url, auth.id);
        if (cached) {
            return cached as OutputData;
        }
        // stringify and parse to turn into a plain object
        const response = JSON.parse(JSON.stringify(
            await handler(auth, props),
        )) as OutputData;
        cacheResponse(url, auth.id, response);
        return response;
    }) satisfies (event: ServerLoadEvent<Params, ParentData, RouteId>) => Promise<HttpError | OutputData>;
}