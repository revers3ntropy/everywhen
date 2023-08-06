import { PUBLIC_ENV } from '$env/static/public';
import { ENABLE_CACHING } from '$lib/constants';
import { error } from '@sveltejs/kit';
import type { RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import chalk from 'chalk';
import type { GenericResponse } from './apiResponse.server';
import { FileLogger } from './log.server';
import { fmtBytes } from './text';
import { nowUtc } from './time';
import type { Auth } from '$lib/controllers/auth/auth';
import { encrypt } from '$lib/utils/encryption';

const cacheLogger = new FileLogger('CACHE', chalk.magentaBright);

const cache: Record<string, Record<string, unknown> | undefined> = {};
const cacheLastUsed: Record<string, number> = {};

const doCache = ENABLE_CACHING && PUBLIC_ENV !== 'dev';

function roughSizeOfObject(object: unknown): number {
    const objectList: unknown[] = [];
    const stack: unknown[] = [object];
    let bytes = 0;

    while (stack.length) {
        const value = stack.pop();

        if (typeof value === 'boolean') {
            bytes += 4;
        } else if (typeof value === 'string') {
            bytes += value.length * 2;
        } else if (typeof value === 'number') {
            bytes += 8;
        } else if (typeof value === 'object' && objectList.indexOf(value) === -1) {
            objectList.push(value);

            for (const i in value) {
                stack.push(value[i as keyof typeof value]);
            }
        }
    }
    return bytes;
}

function logCacheReq(hit: boolean, url: URL) {
    void cacheLogger.log(hit ? chalk.green('HIT ') : chalk.red('MISS'), url.pathname);
}

export function cacheResponse<T>(url: string, userId: string, response: T): void {
    if (!doCache) return;

    cacheLastUsed[userId] = nowUtc(false);
    if (!(userId in cache)) {
        cache[userId] = {};
    }
    (cache[userId] as Record<string, T>)[url] = response;
}

export function getCachedResponse<T>(url: string, userId: string): T | undefined {
    if (!doCache) return;

    cacheLastUsed[userId] = nowUtc();
    const userCache = cache[userId] || {};
    if (url in userCache) {
        logCacheReq(true, new URL(url));
        return userCache[url] as T;
    }
    logCacheReq(false, new URL(url));
    return;
}

export function invalidateCache(userId: string): void {
    if (!doCache) return;

    delete cache[userId];
    delete cacheLastUsed[userId];
}

export function cleanupCache(): number {
    if (!doCache) return 0;

    const now = nowUtc();
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
    void cacheLogger.log(
        chalk.yellow('CLEANUP'),
        `size=${bytesFmt}`,
        `timeout=${timeout}s`,
        `change=${changeFmt}`,
        `(${cleared})`
    );
    return cacheSizeAfter;
}

export function cacheTimeout(size: Bytes): Seconds {
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
    Res extends NonNullable<unknown>
>(
    handler: (auth: Auth, event: RequestEvent<Params, RouteId>) => Promise<Res>
): (event: RequestEvent<Params, RouteId>) => Promise<GenericResponse<Res>> {
    return (async (props: RequestEvent<Params, RouteId>): Promise<GenericResponse<Res>> => {
        const url = props.url.href;
        const auth = props.locals.auth;

        if (!auth) throw error(401, 'Unauthorized');

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
        const responseString = encrypt(JSON.stringify(response), auth.key);

        const responseObj = new Response(responseString, {
            status: 200
        }) as GenericResponse<Res>;

        cacheResponse(url, auth.id, responseObj.clone());
        return responseObj;
    }) satisfies (event: RequestEvent<Params, RouteId>) => Promise<GenericResponse<Res>>;
}

export function cachedPageRoute<
    Params extends Partial<Record<string, string>>,
    ParentData extends Record<string, unknown>,
    OutputData extends Record<string, unknown>,
    RouteId extends string,
    MustHaveAuth extends boolean = true
>(
    handler: (
        auth: Auth | (MustHaveAuth extends true ? Auth : null),
        event: ServerLoadEvent<Params, ParentData, RouteId>
    ) => MaybePromise<OutputData>,
    requireAuth?: MustHaveAuth
): (event: ServerLoadEvent<Params, ParentData, RouteId>) => MaybePromise<OutputData> {
    return (async (
        props: ServerLoadEvent<Params, ParentData, RouteId>
    ): Promise<OutputData & App.PageData> => {
        if (requireAuth === undefined) {
            requireAuth = true as MustHaveAuth;
        }

        const url = props.url.href;
        let auth = props.locals.auth as Auth | (MustHaveAuth extends true ? Auth : null);
        if (requireAuth) {
            if (!auth) throw error(401, 'Unauthorized');
        } else {
            auth = null as unknown as Auth;
        }

        const cached = getCachedResponse(url, auth?.id || '');

        if (cached) {
            return cached as OutputData & App.PageData;
        }

        const res = await handler(auth, props);

        // stringify and parse to turn into a plain object
        const response = JSON.parse(JSON.stringify(res)) as OutputData;

        cacheResponse(url, auth?.id || '', response);

        return response as OutputData & App.PageData;
    }) satisfies (
        event: ServerLoadEvent<Params, ParentData, RouteId>
    ) => MaybePromise<OutputData & App.PageData>;
}
