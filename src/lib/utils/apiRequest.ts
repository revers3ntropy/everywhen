import { browser } from '$app/environment';
import { Auth } from '$lib/controllers/auth/auth';
import { encryptionKey } from '$lib/stores';
import { encrypt } from '$lib/utils/encryption';
import { get } from 'svelte/store';
import type { apiRes404, GenericResponse } from './apiResponse.server';
import { serializeGETArgs } from './GETArgs';
import { clientLogger } from './log';
import { Result } from './result';
import { currentTzOffset, nowUtc } from './time';

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
        '/oauth/gh/user': GET<typeof import('../../routes/api/oauth/gh/user/+server')>;
        '/datasets': GET<typeof import('../../routes/api/datasets/+server')>;
        '/datasets/?': GET<typeof import('../../routes/api/datasets/[datasetId]/+server')>;
    };
    POST: {
        '/users': POST<typeof import('../../routes/api/users/+server')>;
        '/labels': POST<typeof import('../../routes/api/labels/+server')>;
        '/events': POST<typeof import('../../routes/api/events/+server')>;
        '/entries': POST<typeof import('../../routes/api/entries/+server')>;
        '/backups': POST<typeof import('../../routes/api/backups/+server')>;
        '/assets': POST<typeof import('../../routes/api/assets/+server')>;
        '/locations': POST<typeof import('../../routes/api/locations/+server')>;
        '/oauth/gh': POST<typeof import('../../routes/api/oauth/gh/+server')>;
        '/datasets': POST<typeof import('../../routes/api/datasets/+server')>;
        '/datasets/?': POST<typeof import('../../routes/api/datasets/[datasetId]/+server')>;
    };
    DELETE: {
        '/users': DELETE<typeof import('../../routes/api/users/+server')>;
        '/labels/?': DELETE<typeof import('../../routes/api/labels/[labelId]/+server')>;
        '/events/?': DELETE<typeof import('../../routes/api/events/[eventId]/+server')>;
        '/entries/?': DELETE<typeof import('../../routes/api/entries/[entryId]/+server')>;
        '/assets/?': DELETE<typeof import('../../routes/api/assets/[asset]/+server')>;
        '/locations/?': DELETE<typeof import('../../routes/api/locations/[locationId]/+server')>;
        '/auth': DELETE<typeof import('../../routes/api/auth/+server')>;
        '/oauth/gh': DELETE<typeof import('../../routes/api/oauth/gh/+server')>;
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

async function handleOkResponse(
    response: Response,
    method: string,
    url: string,
    key: string | null
): Promise<Result<object>> {
    let textResult: string;
    try {
        textResult = await response.text();
    } catch (e) {
        clientLogger.error(`Error getting text from fetch (${method} ${url})`, response);
        return Result.err('Invalid response from server');
    }

    let jsonRes: unknown;
    try {
        jsonRes = JSON.parse(textResult);
    } catch (e) {
        if (!key) {
            await Auth.logOut();
            return Result.err('Invalid auth');
        }

        const decryptedRes = Auth.decryptOrLogOut(textResult, key);

        try {
            jsonRes = JSON.parse(decryptedRes);
        } catch (e) {
            clientLogger.log({ key, textResult, decryptedRes });
            clientLogger.error(`Can't parse response (${method} ${url})`);
            return Result.err('Invalid response from server');
        }
    }

    if (typeof jsonRes !== 'object' || jsonRes === null) {
        clientLogger.error(`non-object returned (${method} ${url})`, jsonRes);
        return Result.err('Invalid response from server');
    }
    return Result.ok(jsonRes);
}

export async function makeApiReq<
    Verb extends keyof ApiResponse,
    Path extends keyof ApiResponse[Verb],
    Body extends ReqBody
>(
    method: Verb,
    path: string,
    body: Body | null = null,
    encryptBody = true
): Promise<Result<ApiResponse[Verb][Path]>> {
    const url = `/api${path}`;
    if (!browser) {
        return Result.err(`Cannot make API request on server`);
    }

    if (method !== 'GET') {
        body ??= {} as Body;

        body = { ...body };

        // supply default timezone to all requests
        if (browser) {
            body.timezoneUtcOffset ??= currentTzOffset();
        }
        body.utcTimeS ??= nowUtc();
    }

    const init: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        }
    };

    const latestEncryptionKey = get(encryptionKey);

    if (body) {
        if (latestEncryptionKey && encryptBody) {
            init.body = encrypt(JSON.stringify(body), latestEncryptionKey);
        } else {
            init.body = JSON.stringify(body);
        }
    }

    const response = await fetch(url, init);

    if (response.ok) {
        const { err, val } = await handleOkResponse(response, method, url, latestEncryptionKey);
        if (err) return Result.err(err);
        return Result.ok(val as ApiResponse[Verb][Path]);
    }

    if (response.status === 503) {
        return Result.err('Server is down for maintenance');
    }
    clientLogger.error(`Error on api fetch  (${method} ${url})`, response);

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
        path: Path,
        args: Record<string, string | number | boolean | undefined> = {},
        encryptBodyIfCan = true
    ) =>
        await makeApiReq<'GET', Path, Body>(
            'GET',
            path + serializeGETArgs(args),
            null,
            encryptBodyIfCan
        ),

    post: async <Path extends keyof ApiResponse['POST'], Body extends ReqBody>(
        path: Path,
        body: Body = {} as Body,
        encryptBodyIfCan = true
    ) => await makeApiReq<'POST', Path, Body>('POST', path, body, encryptBodyIfCan),

    put: async <Path extends keyof ApiResponse['PUT'], Body extends ReqBody>(
        path: Path,
        body: Body = {} as Body,
        encryptBodyIfCan = true
    ) => await makeApiReq<'PUT', Path, Body>('PUT', path, body, encryptBodyIfCan),

    delete: async <Path extends keyof ApiResponse['DELETE'], Body extends ReqBody>(
        path: Path,
        body: Body = {} as Body,
        encryptBodyIfCan = true
    ) => await makeApiReq<'DELETE', Path, Body>('DELETE', path, body, encryptBodyIfCan)
};

// eg '/labels/?', '1' ==> '/labels/1' but returns '/labels/?' as type
export function apiPath<T extends string>(path: T, ...params: string[]): T {
    return path.replace(/\?/g, () => params.shift() || '') as T;
}

export type Api = typeof api;
