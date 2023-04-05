import type { Handle, RequestEvent, ServerLoadEvent } from '@sveltejs/kit';
import mysql from 'mysql2/promise';
import type { Auth } from './lib/controllers/user';
import { getConfig } from './lib/db/mysql';
import { getAuthFromCookies } from './lib/security/getAuthFromCookies';
import type { GenericResponse } from './lib/utils/apiResponse';

export let dbConnection: mysql.Connection | null = null;

let cache: Record<string, Record<string, unknown>> = {};
console.log('  [CACHE RESET]');

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
        console.log(`  [CACHE HIT] ${url}`);
        return cache[userId][url] as T;
    } else {
        console.log(`  [CACHE MISS] ${url}`);
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

export async function connect () {
    const config = await getConfig();
    dbConnection = await mysql.createConnection(config).catch((e: any) => {
        console.error(`Error connecting to mysql db '${config.database}'`);
        console.error(e);
        throw e;
    });
    console.log(`Connected to database`);
}

// keep connection to database alive
// so it's not re-connected on API request
setInterval(async () => {
    if (!dbConnection) await connect();
    dbConnection?.ping();
}, 1000 * 60);

function logRequest (req: Request): void {
    console.log(new Date().toLocaleTimeString()
        + ' ' + req.method.padEnd(6, ' ')
        + ' ' + new URL(req.url).pathname);
}

process.on('SIGINT', process.exit);
process.on('SIGTERM', process.exit);

export const handle = (async ({ event, resolve }) => {
    logRequest(event.request);
    return resolve(event);
}) satisfies Handle;

