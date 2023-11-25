import { browser } from '$app/environment';
import { notify } from '$lib/components/notifications/notifications';
import { Auth } from '$lib/controllers/auth/auth';
import { encryptionKey } from '$lib/stores';
import { encrypt } from '$lib/utils/encryption';
import { Logger } from '$lib/utils/log';
import { get } from 'svelte/store';
import type { apiRes404, GenericResponse } from './apiResponse.server';
import { serializeGETArgs } from './GETArgs';
import { Result } from './result';
import { currentTzOffset, nowUtc } from './time';
import type { Expand } from '../../types';

const logger = new Logger('ApiRq');

export interface ReqBody {
    timezoneUtcOffset?: number;
    utcTimeS?: number;
    [key: string]: unknown;
}

export interface Options {
    doNotEncryptBody: boolean;
    doNotTryToDecryptResponse: boolean;
    doNotLogoutOn401: boolean;
}

export type ResType<T> = T extends typeof apiRes404
    ? 'this path gives a 404'
    : T extends (props: infer _) => Promise<GenericResponse<infer R>>
      ? R
      : T extends (props: infer _) => GenericResponse<infer R>
        ? R
        : 'not an API route';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ApiRoutes {
    '/labels': typeof import('../../routes/api/labels/+server');
    '/labels/?': typeof import('../../routes/api/labels/[labelId]/+server');
    '/events': typeof import('../../routes/api/events/+server');
    '/entries': typeof import('../../routes/api/entries/+server');
    '/entries/titles': typeof import('../../routes/api/entries/titles/+server');
    '/entries/streaks': typeof import('../../routes/api/entries/streaks/+server');
    '/entries/?': typeof import('../../routes/api/entries/[entryId]/+server');
    '/entries/?/pinned': typeof import('../../routes/api/entries/[entryId]/pinned/+server');
    '/backups': typeof import('../../routes/api/backups/+server');
    '/auth': typeof import('../../routes/api/auth/+server');
    '/assets/?': typeof import('../../routes/api/assets/[assetPublicId]/+server');
    '/settings': typeof import('../../routes/api/settings/+server');
    '/version': typeof import('../../routes/api/version/+server');
    '/locations': typeof import('../../routes/api/locations/+server');
    '/assets': typeof import('../../routes/api/assets/+server');
    '/oauth/gh/user': typeof import('../../routes/api/oauth/gh/user/+server');
    '/datasets': typeof import('../../routes/api/datasets/+server');
    '/datasets/?': typeof import('../../routes/api/datasets/[datasetId]/+server');
    '/users': typeof import('../../routes/api/users/+server');
    '/oauth/gh': typeof import('../../routes/api/oauth/gh/+server');
    '/events/?': typeof import('../../routes/api/events/[eventId]/+server');
    '/locations/?': typeof import('../../routes/api/locations/[locationId]/+server');
    '/feed/?': typeof import('../../routes/api/feed/[day]/+server');
}

export async function makeApiReq<
    Verb extends Method,
    Path extends keyof ApiRoutes,
    Body extends ReqBody
>(
    method: Verb,
    path: Path,
    body: Body | null = null,
    options: Partial<Options> = {}
): Promise<Result<Expand<ResType<ApiRoutes[Path][Verb]>>>> {
    if (!browser) throw new Error(`Cannot make API request on server`);
    const url = `/api${path}`;

    if (method !== 'GET') {
        body ??= {} as Body;

        body = { ...body };

        // supply default timezone to all requests
        body.timezoneUtcOffset ??= currentTzOffset();
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
        if (!options.doNotEncryptBody) {
            if (!latestEncryptionKey) {
                logger.error('no encryption key found', { latestEncryptionKey });
                notify.error('Failed to make API call');
                throw new Error();
            }
            init.body = encrypt(JSON.stringify(body), latestEncryptionKey);
        } else {
            init.body = JSON.stringify(body);
        }
    }

    const response = await fetch(url, init);

    if (response.ok) {
        return await handleOkResponse<Expand<ResType<ApiRoutes[Path][Verb]>>>(
            response,
            method,
            url,
            latestEncryptionKey,
            options
        );
    }

    return Result.err(await handleErrorResponse(response, method, url, options));
}

async function handleOkResponse<T>(
    response: Response,
    method: string,
    url: string,
    key: string | null,
    options: Partial<Options>
): Promise<Result<T>> {
    let textResult: string;
    try {
        textResult = await response.text();
    } catch (e) {
        logger.error(`Error getting text from fetch`, { response, method, url });
        return Result.err('Invalid response from server');
    }

    let jsonRes: unknown;
    try {
        jsonRes = JSON.parse(textResult);
    } catch (e) {
        if (options.doNotTryToDecryptResponse) {
            logger.error('Response is not JSON: ', { textResult, e });
            return Result.err('Invalid response from server');
        }
        if (!key) {
            if (!options.doNotLogoutOn401) await Auth.logOut();
            return Result.err('Something went wrong, please log in again');
        }

        const decryptedRes = Auth.decryptOrLogOut(textResult, key);

        try {
            jsonRes = JSON.parse(decryptedRes);
        } catch (error) {
            logger.error(`Can't parse response`, {
                method,
                url,
                textResult,
                error,
                e
            });
            return Result.err('Invalid response from server');
        }
    }

    if (typeof jsonRes !== 'object' || jsonRes === null) {
        logger.error(`non-object returned`, { jsonRes, method, url });
        return Result.err('Invalid response from server');
    }
    return Result.ok(jsonRes as T);
}

async function handleErrorResponse(
    response: Response,
    method: string,
    url: string,
    options: Partial<Options>
): Promise<string> {
    if (response.status === 503) {
        return 'Server is down for maintenance';
    }
    if (response.status === 401) {
        if (!options.doNotLogoutOn401) await Auth.logOut(true);
        return 'Invalid log in';
    }
    logger.error(`Error on api fetch`, { response, url, method, options });

    try {
        const resTxt = await response.text();
        try {
            const res = JSON.parse(resTxt);
            if (typeof res === 'object' && res !== null) {
                if ('error' in res) {
                    return typeof res.error === 'string' ? res.error : JSON.stringify(res.error);
                }
                if ('message' in res) {
                    return typeof res.message === 'string'
                        ? res.message
                        : JSON.stringify(res.message);
                }
            }
        } catch (e) {
            // ignore
        }
        return resTxt;
    } catch (e) {
        return 'An unknown error has occurred';
    }
}

export const api = {
    get: async <Path extends keyof ApiRoutes, Body extends ReqBody>(
        path: Path,
        args: Record<string, string | number | boolean | undefined> = {},
        options: Partial<Options> = {}
    ) =>
        await makeApiReq<'GET', Path, Body>(
            'GET',
            (path + serializeGETArgs(args)) as Path,
            null,
            options
        ),

    post: async <Path extends keyof ApiRoutes, Body extends ReqBody>(
        path: Path,
        body: Body = {} as Body,
        options: Partial<Options> = {}
    ) => await makeApiReq<'POST', Path, Body>('POST', path, body, options),

    put: async <Path extends keyof ApiRoutes, Body extends ReqBody>(
        path: Path,
        body: Body = {} as Body,
        options: Partial<Options> = {}
    ) => await makeApiReq<'PUT', Path, Body>('PUT', path, body, options),

    delete: async <Path extends keyof ApiRoutes, Body extends ReqBody>(
        path: Path,
        body: Body = {} as Body,
        options: Partial<Options> = {}
    ) => await makeApiReq<'DELETE', Path, Body>('DELETE', path, body, options)
};

export type Api = typeof api;

// eg '/labels/?', '1' ==> '/labels/1' but returns '/labels/?' as type
export function apiPath<T extends string>(path: T, ...params: string[]): T {
    return path.replace(/\?/g, () => params.shift() || '') as T;
}
