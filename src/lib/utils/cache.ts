import type { RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import chalk from 'chalk';
import type { Auth } from '../controllers/user';
import { getAuthFromCookies } from '../security/getAuthFromCookies';
import type { GenericResponse } from './apiResponse';
import { makeLogger } from './log';

const cacheLogger = makeLogger('CACHE', chalk.magentaBright);
cacheLogger.log('Initialised');

const cache: Record<string, Record<string, unknown>> = {};

export function cacheResponse<T> (
    url: string,
    userId: string,
    response: T,
): void {
    cache[userId] = cache[userId] || {};
    cache[userId][url] = response;
}

export function getCachedResponse<T> (
    url: string,
    userId: string,
): T | undefined {
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
    ) => Promise<OutputData>,
): (event: ServerLoadEvent<Params, ParentData, RouteId>) => Promise<OutputData> {
    return (async (props: ServerLoadEvent<Params, ParentData, RouteId>): Promise<OutputData> => {
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
    }) satisfies (event: ServerLoadEvent<Params, ParentData, RouteId>) => Promise<OutputData>;
}