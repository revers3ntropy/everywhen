import { type APIRequestContext, request } from '@playwright/test';
import { serialize } from 'cookie';
import { sha256 } from 'js-sha256';
import {
    AUTH_COOKIE_OPTIONS,
    KEY_COOKIE_KEY,
    USERNAME_COOKIE_KEY,
} from '../src/lib/constants.js';
import type { Auth, RawAuth } from '../src/lib/controllers/user.js';
import { Result } from '../src/lib/utils/result.js';

export function randStr (
    length = 10,
    characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz',
): string {
    let result = ' ';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

export async function generateUser (
    api: APIRequestContext,
): Promise<Result<Auth & { password: string }>> {
    const username = randStr();
    const password = randStr();

    const key = sha256(password).substring(0, 32);

    const makeRes = await api.post('/users', {
        data: {
            username,
            password: key,
        },
    });
    if (!makeRes.ok()) {
        return Result.err(JSON.parse(await makeRes.json()).message);
    }

    const authRes = await api.get('/auth', {
        data: {
            username, key,
        },
    });
    if (!authRes.ok()) {
        return Result.err(JSON.parse(await authRes.json()).message);
    }

    return Result.ok({
        key,
        username,
        password,
        id: JSON.parse(await authRes.json()).id,
    });
}

export async function deleteUser (api: APIRequestContext): Promise<Result> {
    const res = await api.delete('/users');
    if (res.ok()) return Result.ok(null);
    const body = JSON.parse(await res.json());
    return Result.err(body.message);
}

export async function generateApiCtx (auth: RawAuth): Promise<APIRequestContext> {
    return await request.newContext({
        baseURL: '/api',
        extraHTTPHeaders: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cookie':
                serialize(KEY_COOKIE_KEY, auth.key, AUTH_COOKIE_OPTIONS)
                + ' ; '
                + serialize(USERNAME_COOKIE_KEY, auth.username, AUTH_COOKIE_OPTIONS),
        },
    });
}