import { type APIRequestContext, type Expect, type Page, request } from '@playwright/test';
import { serialize } from 'cookie';
import { STORE_KEY, KEY_COOKIE_OPTIONS, USERNAME_COOKIE_OPTIONS } from '../src/lib/constants.js';
import type { Auth, RawAuth } from '$lib/controllers/user/user.js';
import { encryptionKeyFromPassword } from '../src/lib/security/authUtils.js';
import { Result } from '../src/lib/utils/result.js';

export function randStr(
    length = 10,
    characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz'
): string {
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

export async function generateUser(): Promise<{
    auth: Auth & { password: string };
    api: APIRequestContext;
}> {
    const username = randStr();
    const password = randStr();

    const key = encryptionKeyFromPassword(password);

    const api = await generateApiCtx();

    const makeRes = await api.post('./users', {
        data: {
            username,
            password: key
        }
    });
    if (!makeRes.ok()) {
        throw await makeRes.text();
    }

    const authRes = await api.get('./auth', {
        params: {
            username,
            key
        }
    });
    if (!authRes.ok()) {
        throw await authRes.text();
    }

    const auth = {
        key,
        username,
        password,
        id: ((await authRes.json()) as { id: string }).id
    };

    return {
        auth,
        api: await generateApiCtx(auth)
    };
}

export async function generateUserAndSignIn(page: Page): Promise<{
    auth: Auth & { password: string };
    api: APIRequestContext;
}> {
    await page.goto('/login', { waitUntil: 'networkidle' });
    const { auth, api } = await generateUser();

    await page.getByLabel('Username').click();
    await page.getByLabel('Username').type(auth.username);
    await page.getByLabel('Password').fill(auth.password);
    await page.getByRole('button', { name: 'Log In' }).click();

    await page.waitForURL('/home');

    return { auth, api };
}

export async function deleteUser(api: APIRequestContext): Promise<Result> {
    const res = await api.delete('./users');
    if (res.ok()) return Result.ok(null);
    const body = await res.text();
    try {
        return Result.err(String((JSON.parse(body) as Record<string, unknown>)?.message || body));
    } catch (e) {
        return Result.err(body);
    }
}

export async function expectDeleteUser(api: APIRequestContext, expect: Expect): Promise<void> {
    const { err } = await deleteUser(api);
    expect(err).toBe(null);
}

export async function generateApiCtx(auth: RawAuth | null = null): Promise<APIRequestContext> {
    return await request.newContext({
        baseURL: 'http://localhost:5173/api/',
        extraHTTPHeaders: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Cookie: auth
                ? serialize(STORE_KEY.key, auth.key, KEY_COOKIE_OPTIONS) +
                  ' ; ' +
                  serialize(STORE_KEY.username, auth.username, USERNAME_COOKIE_OPTIONS)
                : ''
        }
    });
}
