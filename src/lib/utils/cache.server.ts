import { isStaging, isProd } from '$lib/utils/env';
import { error, redirect } from '@sveltejs/kit';
import type { RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import type { Bytes, MaybePromise, Seconds } from '../../types';
import type { GenericResponse } from './apiResponse.server';
import { nowUtc } from './time';
import { Auth } from '$lib/controllers/auth/auth';
import { encrypt } from '$lib/utils/encryption';

const cache: Record<string, Record<string, unknown> | undefined> = {};
const cacheLastUsed: Record<string, number> = {};

const doCache = isStaging() || isProd();

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

export function cacheResponse<T>(url: string, userId: string, response: T): void {
    if (!doCache) return;

    cacheLastUsed[userId] = nowUtc(false);
    if (!(userId in cache)) {
        cache[userId] = {};
    }
    (cache[userId] as Record<string, T>)[url] = response;
}

export function getCachedResponse<T>(url: string, userId: string): T | undefined {
    if (!doCache) return undefined;

    cacheLastUsed[userId] = nowUtc();
    const userCache = cache[userId] || {};
    if (url in userCache) {
        return userCache[url] as T;
    }
    return undefined;
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

    for (const userId of Object.keys(cacheLastUsed)) {
        const timeSinceLastUsed = now - cacheLastUsed[userId];
        if (timeSinceLastUsed > timeout) {
            invalidateCache(userId);
        }
    }

    return roughSizeOfObject(cache);
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
    return (async (event: RequestEvent<Params, RouteId>): Promise<GenericResponse<Res>> => {
        const url = event.url.href;
        const auth = event.locals.auth;

        if (!auth) error(401, 'Unauthorized');

        const cached = getCachedResponse<Response>(url, auth.id)?.clone();
        if (cached) {
            return cached as GenericResponse<Res>;
        }

        const response = await handler(auth, event);
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
            if (!auth) redirect(301, Auth.wantsToStayLoggedInAuthUrl(url));
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
