import { browser } from '$app/environment';
import { PUBLIC_SVELTEKIT_PORT } from '$env/static/public';
import type { HttpMethod } from '@sveltejs/kit/types/private';
import { serialize } from 'cookie';
import { AUTH_COOKIE_OPTIONS, KEY_COOKIE_KEY, USERNAME_COOKIE_KEY } from '../constants';
import type { Auth } from '../controllers/user';
import { GETArgs, Result } from '../utils';

export async function makeApiReq<T extends object> (
    auth: Auth,
    method: HttpMethod,
    path: string,
    body: T | null = null,
): Promise<Result<Record<string, any>>> {
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
        return Result.ok(res);
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
    get: async (auth: Auth, path: string, args: object | null = null) =>
        await makeApiReq(auth, 'GET', path + (args ? GETArgs(args) : '')),
    post: async (auth: Auth, path: string, body: any = {}) =>
        await makeApiReq(auth, 'POST', path, body),
    put: async (auth: Auth, path: string, body: any = {}) =>
        await makeApiReq(auth, 'PUT', path, body),
    delete: async (auth: Auth, path: string, body: any = {}) =>
        await makeApiReq(auth, 'DELETE', path, body),
};
