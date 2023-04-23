import type { MaybePromise } from '$app/forms';
import type { RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import chalk from 'chalk';
import type { Auth } from '../controllers/user';
import { getAuthFromCookies } from '../security/getAuthFromCookies';
import type { GenericResponse } from './apiResponse';
import { makeLogger } from './log';
import { fmtBytes } from './text';
import { nowS } from './time';
import type { Bytes, Seconds } from './types';

const cacheLogger = makeLogger('CACHE', chalk.magentaBright, 'general.log');

const cache: Record<string, Record<string, unknown>> = {};
const cacheLastUsed: Record<string, number> = {};

function roughSizeOfObject (object: unknown): number {
    const objectList: unknown[] = [];
    const stack: unknown[] = [ object ];
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
                stack.push(value[i as keyof typeof value]);
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

function logReq (hit: boolean, url: URL) {
    const path = url.pathname.split('/');
    path.shift();
    let pathStr = `/${path.shift() || ''}`;
    if (pathStr === '/api') {
        pathStr += `/${path.shift() || ''}`;
    }
    if (path.length) {
        pathStr += `/[...${path.join('/').length}]`;
    }

    void cacheLogger.logToFile(
        hit ? chalk.green('HIT ') : chalk.red('MISS'),
        pathStr,
    );
}

export function getCachedResponse<T> (
    url: string,
    userId: string,
): T | undefined {
    cacheLastUsed[userId] = nowS();
    if (url in cache[userId]) {
        logReq(true, new URL(url));
        return cache[userId][url] as T;
    } else {
        logReq(false, new URL(url));
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
    void cacheLogger.logToFile(
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
    Res extends NonNullable<unknown>,
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
    ParentData extends Record<string, unknown>,
    OutputData extends Record<string, unknown>,
    RouteId extends string
> (
    handler: (
        auth: Auth,
        event: ServerLoadEvent<Params, ParentData, RouteId>,
    ) => MaybePromise<OutputData>,
    // doesn't actually return `OutputData & App.PageData`,
    // but needs to act like it to satisfy the type checker with `svelte-check`
): (event: ServerLoadEvent<Params, ParentData, RouteId>) => MaybePromise<OutputData & App.PageData> {
    return (async (props: ServerLoadEvent<Params, ParentData, RouteId>): Promise<OutputData & App.PageData> => {
        const url = props.url.href;
        const auth = await getAuthFromCookies(props.cookies);
        const cached = getCachedResponse(url, auth.id);
        if (cached) {
            return cached as OutputData & App.PageData;
        }
        // stringify and parse to turn into a plain object
        const response = JSON.parse(JSON.stringify(
            await handler(auth, props),
        )) as OutputData;
        cacheResponse(url, auth.id, response);
        return response as OutputData & App.PageData;
    }) satisfies (event: ServerLoadEvent<Params, ParentData, RouteId>) => MaybePromise<OutputData & App.PageData>;
}