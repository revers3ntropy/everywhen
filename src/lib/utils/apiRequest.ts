import { browser } from '$app/environment';
import { PUBLIC_SVELTEKIT_PORT } from '$env/static/public';
import { serialize } from 'cookie';
import {
    KEY_COOKIE_KEY,
    KEY_COOKIE_OPTIONS,
    USERNAME_COOKIE_KEY,
    USERNAME_COOKIE_OPTIONS,
} from '../constants';
import type { Auth } from '../controllers/user';
import type { apiRes404, GenericResponse } from './apiResponse';
import { GETArgs } from './GETArgs';
import { Result } from './result';
import { nowS } from './time';

export type ReqBody = {
    timezoneUtcOffset?: number,
    utcTimeS?: number,
    [key: string]: any,
}

export type ResType<T> =
    T extends (props: any) => Promise<GenericResponse<infer R>>
        ? T extends typeof apiRes404
            ? 'this path gives a 404'
            : R
        : 'not an API route';

export type GET<T extends { GET: unknown }> = ResType<T['GET']>;
export type POST<T extends { POST: unknown }> = ResType<T['POST']>;
export type PUT<T extends { PUT: unknown }> = ResType<T['PUT']>;
export type DELETE<T extends { DELETE: unknown }> = ResType<T['DELETE']>;

interface ApiResponse {
    'GET': {
        '/labels': GET<typeof import('../../routes/api/labels/+server')>,
        '/labels/?': GET<typeof import('../../routes/api/labels/[labelId]/+server')>,
        '/events': GET<typeof import('../../routes/api/events/+server')>,
        '/entries': GET<typeof import('../../routes/api/entries/+server')>,
        '/entries/titles': GET<typeof import('../../routes/api/entries/titles/+server')>,
        '/entries/?': GET<typeof import('../../routes/api/entries/[entryId]/+server')>,
        '/backups': GET<typeof import('../../routes/api/backups/+server')>,
        '/auth': GET<typeof import('../../routes/api/auth/+server')>,
        '/assets/?': GET<typeof import('../../routes/api/assets/[asset]/+server')>,
        '/settings': GET<typeof import('../../routes/api/settings/+server')>,
        '/version': GET<typeof import('../../routes/api/version/+server')>,
    },
    'POST': {
        '/users': POST<typeof import('../../routes/api/users/+server')>,
        '/labels': POST<typeof import('../../routes/api/labels/+server')>,
        '/events': POST<typeof import('../../routes/api/events/+server')>,
        '/entries': POST<typeof import('../../routes/api/entries/+server')>,
        '/backups': POST<typeof import('../../routes/api/backups/+server')>,
        '/assets': POST<typeof import('../../routes/api/assets/+server')>,
    },
    'DELETE': {
        '/users': DELETE<typeof import('../../routes/api/users/+server')>,
        '/labels/?': DELETE<typeof import('../../routes/api/labels/[labelId]/+server')>,
        '/events/?': DELETE<typeof import('../../routes/api/events/[eventId]/+server')>,
        '/entries/?': DELETE<typeof import('../../routes/api/entries/[entryId]/+server')>,
        '/assets/?': DELETE<typeof import('../../routes/api/assets/[asset]/+server')>,
    },
    'PUT': {
        '/labels/?': PUT<typeof import('../../routes/api/labels/[labelId]/+server')>,
        '/events/?': PUT<typeof import('../../routes/api/events/[eventId]/+server')>,
        '/settings': PUT<typeof import('../../routes/api/settings/+server')>,
        '/entries/?': PUT<typeof import('../../routes/api/entries/[entryId]/+server')>,
    },
}

export async function makeApiReq<
    Verb extends keyof ApiResponse,
    Path extends keyof ApiResponse[Verb],
    Body extends ReqBody
> (
    auth: Auth,
    method: Verb,
    path: string,
    body: Body | null = null,
): Promise<Result<ApiResponse[Verb][Path]>> {
    let url = `/api${path}`;
    if (!browser) {
        console.trace('fetch from backend');
        url = `http://localhost:${PUBLIC_SVELTEKIT_PORT}${url}`;
    }

    if (method !== 'GET') {
        body ??= {} as Body;
        // supply default timezone to all requests
        if (browser) {
            body.timezoneUtcOffset ??= -(new Date().getTimezoneOffset() / 60);
        }
        body.utcTimeS ??= nowS();
    }

    const init: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cookie':
                serialize(KEY_COOKIE_KEY, auth.key, KEY_COOKIE_OPTIONS)
                + ' ; '
                + serialize(USERNAME_COOKIE_KEY, auth.username, USERNAME_COOKIE_OPTIONS),
        },
    };

    if (body) {
        init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);

    if (response.ok) {
        const res = await response.json();
        if (typeof res !== 'object' || res === null) {
            console.error(
                `Error on api fetch (${browser ? 'client' : 'server'} side)`,
                method,
                url,
                'Gave non-object response:',
                response,
            );
            return Result.err(`Invalid response from server`);
        }
        return Result.ok(res as ApiResponse[Verb][Path]);
    }
    console.error(
        `Error on api fetch (${browser ? 'client' : 'server'} side)`,
        method,
        url,
        'Gave erroneous response:',
        response,
    );

    try {
        return Result.err(await response.text());
    } catch (e) {
        return Result.err('An unknown error has occurred');
    }
}

export const api = {
    get: async <Path extends keyof ApiResponse['GET'], Body extends ReqBody> (
        auth: Auth, path: Path, args: object | null = null,
    ) => {
        return await makeApiReq<'GET', Path, Body>(
            auth, 'GET', path + (args ? GETArgs(args) : ''));
    },

    post: async <Path extends keyof ApiResponse['POST'], Body extends ReqBody> (
        auth: Auth, path: Path, body: Body = {} as Body,
    ) => {
        return await makeApiReq<'POST', Path, Body>(
            auth, 'POST', path, body);
    },

    put: async <Path extends keyof ApiResponse['PUT'], Body extends ReqBody> (
        auth: Auth, path: Path, body: Body = {} as Body,
    ) => {
        return await makeApiReq<'PUT', Path, Body>(
            auth, 'PUT', path, body);
    },

    delete: async <Path extends keyof ApiResponse['DELETE'], Body extends ReqBody> (
        auth: Auth, path: Path, body: Body = {} as Body,
    ) => {
        return await makeApiReq<'DELETE', Path, Body>(
            auth, 'DELETE', path, body);
    },
};

// eg '/labels/?', '1' ==> '/labels/1' but returns '/labels/?' as type
export function apiPath<T extends string> (
    path: T,
    ...params: string[]
): T {
    return path.replace(
        /\?/g,
        () => params.shift() || '',
    ) as T;
}