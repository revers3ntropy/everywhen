import { request } from '@playwright/test';
import type { APIRequestContext, APIResponse } from '@playwright/test';
import { type SerializeOptions, serialize } from 'cookie';
import { COOKIE_KEYS } from '../../src/lib/constants';
import type { ApiRoutes, ReqBody, ResType } from '../../src/lib/utils/apiRequest';
import type { Hours, TimestampSecs } from '../../src/types';
import { decrypt, encrypt } from './encryption';
import { serializeGETArgs } from '../../src/lib/utils/GETArgs';
import { Result } from '../../src/lib/utils/result';
import type { Expand } from '../../src/types';

export function nowUtc(rounded = true): TimestampSecs {
    const s = Date.now() / 1000;
    return rounded ? Math.floor(s) : s;
}

export function currentTzOffset(): Hours {
    return -(new Date().getTimezoneOffset() / 60);
}

type Method = 'get' | 'post' | 'put' | 'delete';

interface Options {
    doNotEncryptBody: boolean;
    doNotTryToDecryptResponse: boolean;
}

interface ErrResponse {
    message: string;
    status: number;
}

export function sessionCookieOptions(): Readonly<SerializeOptions & { path: string }> {
    const maxAge = 60 * 60;
    const expires = new Date(Math.floor(Date.now() / 1000) * 1000 + maxAge * 1000);
    return Object.freeze({
        secure: false,
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
        expires,
        maxAge
    });
}

export class ApiClient {
    public static async fromSessionId(sessionId: string, encryptionKey: string) {
        const client = await request.newContext({
            baseURL: 'http://localhost:5173/api/',
            extraHTTPHeaders: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Cookie: sessionId
                    ? serialize(COOKIE_KEYS.sessionId, sessionId, sessionCookieOptions())
                    : ''
            }
        });
        return new ApiClient(encryptionKey, client);
    }

    public async get<Path extends keyof ApiRoutes, Body extends ReqBody>(
        path: Path,
        args: Record<string, string | number | boolean | undefined> = {},
        options: Partial<Options> = {}
    ) {
        return await this.makeApiReq<'get', Path, Body>(
            'get',
            (path + serializeGETArgs(args)) as Path,
            null,
            options
        );
    }

    public async post<Path extends keyof ApiRoutes, Body extends ReqBody>(
        path: Path,
        body: Body = {} as Body,
        options: Partial<Options> = {}
    ) {
        return await this.makeApiReq<'post', Path, Body>('post', path, body, options);
    }

    public async put<Path extends keyof ApiRoutes, Body extends ReqBody>(
        path: Path,
        body: Body = {} as Body,
        options: Partial<Options> = {}
    ) {
        return await this.makeApiReq<'put', Path, Body>('put', path, body, options);
    }

    public async delete<Path extends keyof ApiRoutes, Body extends ReqBody>(
        path: Path,
        body: Body = {} as Body,
        options: Partial<Options> = {}
    ) {
        return await this.makeApiReq<'delete', Path, Body>('delete', path, body, options);
    }

    // eg '/labels/?', '1' ==> '/labels/1' but returns '/labels/?' as type
    public apiPath<T extends string>(path: T, ...params: string[]): T {
        return path.replace(/\?/g, () => params.shift() || '') as T;
    }

    public async rawReq(method: Method, path: string, data?: unknown): Promise<APIResponse> {
        return await this.client[method](`.${path}`, { data });
    }

    private constructor(
        private readonly key: string,
        private readonly client: APIRequestContext
    ) {}

    private async makeApiReq<
        Verb extends Method,
        Path extends keyof ApiRoutes,
        Body extends ReqBody
    >(
        method: Verb,
        path: Path,
        body: Body | null = null,
        options: Partial<Options> = {}
    ): Promise<Result<Expand<ResType<ApiRoutes[Path][Uppercase<Verb>]>>, ErrResponse>> {
        const url = `.${path}`;

        if (method !== 'get') {
            body ??= {} as Body;

            body = { ...body };

            // supply default timezone to all requests
            body.timezoneUtcOffset ??= currentTzOffset();
            body.utcTimeS ??= nowUtc();
        }

        let bodyStr = '';
        if (body) {
            if (!options.doNotEncryptBody) {
                if (!this.key) {
                    console.error('no encryption key found', { key: this });
                    throw new Error();
                }
                bodyStr = encrypt(JSON.stringify(body), this.key);
            } else {
                bodyStr = JSON.stringify(body);
            }
        }

        let response;
        if (method === 'get') {
            response = await this.client[method](url);
        } else {
            response = await this.client[method](url, { data: bodyStr });
        }

        if (response.ok()) {
            return await this.handleOkResponse<Expand<ResType<ApiRoutes[Path][Uppercase<Verb>]>>>(
                response,
                method,
                url,
                this.key,
                options
            );
        }

        const textResult = await response.text();
        try {
            return Result.err({
                message: decrypt(textResult, this.key).unwrap(),
                status: response.status()
            });
        } catch (e) {
            console.error(e);
        }
        return Result.err({
            message: textResult,
            status: response.status()
        });
    }

    private async handleOkResponse<T>(
        response: APIResponse,
        method: string,
        url: string,
        key: string | null,
        options: Partial<Options>
    ): Promise<Result<T, ErrResponse>> {
        const status = response.status();
        let textResult: string;
        try {
            textResult = await response.text();
        } catch (e) {
            console.error(`Error getting text from fetch`, { response, method, url, e });
            return Result.err({ message: 'No response', status: response.status() });
        }

        let jsonRes: unknown;
        try {
            jsonRes = JSON.parse(textResult);
        } catch (e) {
            if (options.doNotTryToDecryptResponse) {
                console.error('Response is not JSON', { textResult, e });
                return Result.err({ message: 'Response is not JSON', status });
            }

            const decryptedRes = decrypt(textResult, key);
            if (!decryptedRes.ok) return Result.err({ message: decryptedRes.err || '', status });

            try {
                jsonRes = JSON.parse(decryptedRes.val);
            } catch (error) {
                console.error(`Can't parse response`, {
                    method,
                    url,
                    textResult,
                    e,
                    error
                });
                return Result.err({ message: `Can't parse response`, status });
            }
        }

        if (typeof jsonRes !== 'object' || jsonRes === null) {
            console.error(`non-object returned`, { jsonRes, method, url });
            return Result.err({ message: `non-object returned`, status });
        }
        return Result.ok(jsonRes as T);
    }
}
