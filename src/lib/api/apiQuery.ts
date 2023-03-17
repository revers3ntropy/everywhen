import { browser } from '$app/environment';
import { PUBLIC_SVELTEKIT_PORT } from '$env/static/public';
import type { HttpMethod } from '@sveltejs/kit/types/private';
import { serialize } from 'cookie';
import { AUTH_COOKIE_OPTIONS, KEY_COOKIE_KEY, USERNAME_COOKIE_KEY } from '../constants';
import type { Auth } from '../controllers/user';
import type { GenericResponse } from '../utils/apiResponse';
import { GETArgs } from '../utils/GETArgs';
import { Result } from '../utils/result';

export type ResType<T> = T extends (props: any) =>
    Promise<GenericResponse<infer R>> ? R : never;

export type GET<T extends { GET: unknown }> = ResType<T['GET']>;
export type POST<T extends { POST: unknown }> = ResType<T['POST']>;
export type PUT<T extends { PUT: unknown }> = ResType<T['PUT']>;
export type DELETE<T extends { DELETE: unknown }> = ResType<T['DELETE']>;

interface ApiResponse {
    'GET': {
        '/timeline': GET<typeof import('../../routes/api/timeline/+server')>,
        '/labels': GET<typeof import('../../routes/api/labels/+server')>,
        '/labels/': GET<typeof import('../../routes/api/labels/[labelId]/+server')>,
        '/events': GET<typeof import('../../routes/api/events/+server')>,
        '/entries': GET<typeof import('../../routes/api/entries/+server')>,
        '/entries/titles': GET<typeof import('../../routes/api/entries/titles/+server')>,
        '/backups': GET<typeof import('../../routes/api/backups/+server')>,
        '/auth': GET<typeof import('../../routes/api/auth/+server')>,
        '/assets/': GET<typeof import('../../routes/api/assets/[asset]/+server')>,
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
        '/labels/': DELETE<typeof import('../../routes/api/labels/[labelId]/+server')>,
        '/events/': DELETE<typeof import('../../routes/api/events/[eventId]/+server')>,
        '/entries/': DELETE<typeof import('../../routes/api/entries/[entryId]/+server')>,
    },
    'PUT': {
        '/labels/': PUT<typeof import('../../routes/api/labels/[labelId]/+server')>,
        '/events/': PUT<typeof import('../../routes/api/events/[eventId]/+server')>,
        '/entries/': PUT<typeof import('../../routes/api/entries/[entryId]/+server')>,
    },
}

export async function makeApiReq<
    Verb extends keyof ApiResponse,
    Path extends keyof ApiResponse[Verb],
    Body extends object
> (
    auth: Auth,
    method: HttpMethod,
    path: string,
    body: Body | null = null,
): Promise<Result<ApiResponse[Verb][Path]>> {
    let url = `/api${path}`;
    if (!browser) {
        console.trace('fetch from backend');
        url = `http://localhost:${PUBLIC_SVELTEKIT_PORT}${url}`;
    }

    const init: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Cookie:
                serialize(KEY_COOKIE_KEY, auth.key, AUTH_COOKIE_OPTIONS)
                + ' ; '
                + serialize(USERNAME_COOKIE_KEY, auth.username, AUTH_COOKIE_OPTIONS),
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
    get: async <Path extends keyof ApiResponse['GET'], Body extends object> (
        auth: Auth, path: Path, args: object | null = null,
    ) => {
        return await makeApiReq<'GET', Path, Body>(
            auth, 'GET', path + (args ? GETArgs(args) : ''));
    },

    post: async <Path extends keyof ApiResponse['POST'], Body extends object> (
        auth: Auth, path: Path, body: any = {},
    ) => {
        return await makeApiReq<'POST', Path, Body>(
            auth, 'POST', path, body);
    },

    put: async <Path extends keyof ApiResponse['PUT'], Body extends object> (
        auth: Auth, path: Path, body: any = {},
    ) => {
        return await makeApiReq<'PUT', Path, Body>(
            auth, 'PUT', path, body);
    },

    delete: async <Path extends keyof ApiResponse['DELETE'], Body extends object> (
        auth: Auth, path: Path, body: any = {},
    ) => {
        return await makeApiReq<'DELETE', Path, Body>(
            auth, 'DELETE', path, body);
    },
};

// TODO make this work with template strings maybe?
export function apiPath<T extends string> (
    path: T,
    param: string,
): T {
    return path + param as T;
}