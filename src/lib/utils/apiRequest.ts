import { browser } from '$app/environment';
import { PUBLIC_SVELTEKIT_PORT } from '$env/static/public';
import { serialize } from 'cookie';
import { KEY_COOKIE_OPTIONS, STORE_KEY, USERNAME_COOKIE_OPTIONS } from '../constants';
import type { Auth } from '../controllers/user/user';
import type { apiRes404, GenericResponse } from './apiResponse';
import { serializeGETArgs } from './GETArgs';
import { errorLogger } from './log';
import { Result } from './result';
import { nowUtc } from './time';

export type ReqBody = {
    timezoneUtcOffset?: number;
    utcTimeS?: number;
    [key: string]: unknown;
};

export type ResType<T> = T extends typeof apiRes404
    ? 'this path gives a 404'
    : T extends (props: infer _) => Promise<GenericResponse<infer R>>
    ? R
    : T extends (props: infer _) => GenericResponse<infer R>
    ? R
    : 'not an API route';

export type GET<T extends { GET: unknown }> = ResType<T['GET']>;
export type POST<T extends { POST: unknown }> = ResType<T['POST']>;
export type PUT<T extends { PUT: unknown }> = ResType<T['PUT']>;
export type DELETE<T extends { DELETE: unknown }> = ResType<T['DELETE']>;

interface ApiResponse {
    GET: {
        '/labels': GET<typeof import('../../routes/api/labels/+server')>;
        '/labels/?': GET<typeof import('../../routes/api/labels/[labelId]/+server')>;
        '/events': GET<typeof import('../../routes/api/events/+server')>;
        '/entries': GET<typeof import('../../routes/api/entries/+server')>;
        '/entries/titles': GET<typeof import('../../routes/api/entries/titles/+server')>;
        '/entries/streaks': GET<typeof import('../../routes/api/entries/streaks/+server')>;
        '/entries/?': GET<typeof import('../../routes/api/entries/[entryId]/+server')>;
        '/entries/?/pinned': GET<
            typeof import('../../routes/api/entries/[entryId]/pinned/+server')
        >;
        '/backups': GET<typeof import('../../routes/api/backups/+server')>;
        '/auth': GET<typeof import('../../routes/api/auth/+server')>;
        '/assets/?': GET<typeof import('../../routes/api/assets/[asset]/+server')>;
        '/settings': GET<typeof import('../../routes/api/settings/+server')>;
        '/version': GET<typeof import('../../routes/api/version/+server')>;
        '/locations': GET<typeof import('../../routes/api/locations/+server')>;
        '/assets': GET<typeof import('../../routes/api/assets/+server')>;
    };
    POST: {
        '/users': POST<typeof import('../../routes/api/users/+server')>;
        '/labels': POST<typeof import('../../routes/api/labels/+server')>;
        '/events': POST<typeof import('../../routes/api/events/+server')>;
        '/entries': POST<typeof import('../../routes/api/entries/+server')>;
        '/backups': POST<typeof import('../../routes/api/backups/+server')>;
        '/assets': POST<typeof import('../../routes/api/assets/+server')>;
        '/locations': POST<typeof import('../../routes/api/locations/+server')>;
    };
    DELETE: {
        '/users': DELETE<typeof import('../../routes/api/users/+server')>;
        '/labels/?': DELETE<typeof import('../../routes/api/labels/[labelId]/+server')>;
        '/events/?': DELETE<typeof import('../../routes/api/events/[eventId]/+server')>;
        '/entries/?': DELETE<typeof import('../../routes/api/entries/[entryId]/+server')>;
        '/assets/?': DELETE<typeof import('../../routes/api/assets/[asset]/+server')>;
        '/locations/?': DELETE<typeof import('../../routes/api/locations/[locationId]/+server')>;
        '/auth': DELETE<typeof import('../../routes/api/auth/+server')>;
    };
    PUT: {
        '/labels/?': PUT<typeof import('../../routes/api/labels/[labelId]/+server')>;
        '/events/?': PUT<typeof import('../../routes/api/events/[eventId]/+server')>;
        '/settings': PUT<typeof import('../../routes/api/settings/+server')>;
        '/entries/?': PUT<typeof import('../../routes/api/entries/[entryId]/+server')>;
        '/entries/?/pinned': PUT<
            typeof import('../../routes/api/entries/[entryId]/pinned/+server')
        >;
        '/locations/?': PUT<typeof import('../../routes/api/locations/[locationId]/+server')>;
        '/auth': PUT<typeof import('../../routes/api/auth/+server')>;
    };
}

export async function makeApiReq<
    Verb extends keyof ApiResponse,
    Path extends keyof ApiResponse[Verb],
    Body extends ReqBody
>(
    auth: Auth | null,
    method: Verb,
    path: string,
    body: Body | null = null
): Promise<Result<ApiResponse[Verb][Path]>> {
    let url = `/api${path}`;
    if (!browser) {
        console.trace('fetch from backend');
        url = `http://localhost:${PUBLIC_SVELTEKIT_PORT}${url}`;
    }

    if (method !== 'GET') {
        body ??= {} as Body;

        body = { ...body };

        // supply default timezone to all requests
        if (browser) {
            body.timezoneUtcOffset ??= -(new Date().getTimezoneOffset() / 60);
        }
        body.utcTimeS ??= nowUtc();
    }

    let cookie = '';
    if (auth) {
        cookie =
            serialize(STORE_KEY.key, auth.key, KEY_COOKIE_OPTIONS) +
            ' ; ' +
            serialize(STORE_KEY.username, auth.username, USERNAME_COOKIE_OPTIONS);
    }

    const init: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Cookie: cookie
        }
    };

    if (body) {
        init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);

    if (response.ok) {
        const res = await response.json();
        if (typeof res !== 'object' || res === null) {
            errorLogger.error(
                `Error on api fetch (${browser ? 'client' : 'server'} side)`,
                method,
                url,
                'Gave non-object response:',
                response
            );
            return Result.err(`Invalid response from server`);
        }
        return Result.ok(res as ApiResponse[Verb][Path]);
    }

    if (response.status === 503) {
        return Result.err('Server is down for maintenance');
    }
    errorLogger.error(
        `Error on api fetch (${browser ? 'client' : 'server'} side)`,
        method,
        url,
        'Gave erroneous response:',
        response
    );

    try {
        const resTxt = await response.text();
        try {
            const res = JSON.parse(resTxt);
            if (typeof res === 'object' && res !== null) {
                if ('error' in res) {
                    return Result.err(
                        typeof res.error === 'string' ? res.error : JSON.stringify(res.error)
                    );
                }
                if ('message' in res) {
                    return Result.err(
                        typeof res.message === 'string' ? res.message : JSON.stringify(res.message)
                    );
                }
            }
        } catch (e) {
            // ignore
        }
        return Result.err(resTxt);
    } catch (e) {
        return Result.err('An unknown error has occurred');
    }
}

export const api = {
    get: async <Path extends keyof ApiResponse['GET'], Body extends ReqBody>(
        auth: Auth | null,
        path: Path,
        args: Record<string, string | number | boolean | undefined> = {}
    ) => await makeApiReq<'GET', Path, Body>(auth, 'GET', path + serializeGETArgs(args)),

    post: async <Path extends keyof ApiResponse['POST'], Body extends ReqBody>(
        auth: Auth | null,
        path: Path,
        body: Body = {} as Body
    ) => await makeApiReq<'POST', Path, Body>(auth, 'POST', path, body),

    put: async <Path extends keyof ApiResponse['PUT'], Body extends ReqBody>(
        auth: Auth | null,
        path: Path,
        body: Body = {} as Body
    ) => await makeApiReq<'PUT', Path, Body>(auth, 'PUT', path, body),

    delete: async <Path extends keyof ApiResponse['DELETE'], Body extends ReqBody>(
        auth: Auth | null,
        path: Path,
        body: Body = {} as Body
    ) => await makeApiReq<'DELETE', Path, Body>(auth, 'DELETE', path, body)
};

// eg '/labels/?', '1' ==> '/labels/1' but returns '/labels/?' as type
export function apiPath<T extends string>(path: T, ...params: string[]): T {
    return path.replace(/\?/g, () => params.shift() || '') as T;
}

export type Api = typeof api;
