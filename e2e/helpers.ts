import { type APIRequestContext, type Expect, type Page, request } from '@playwright/test';
import { serialize } from 'cookie';
import { COOKIE_KEYS, sessionCookieOptions } from '../src/lib/constants.js';
import { encryptionKeyFromPassword } from '../src/lib/security/authUtils.server.js';
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

export interface SessionAuth {
    sessionId: string;
    key: string;
    username: string;
    password: string;
}

export async function generateUser(): Promise<{
    auth: SessionAuth;
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

    const auth: SessionAuth = {
        key,
        username,
        password,
        sessionId: ((await authRes.json()) as { username: string; sessionId: string }).sessionId
    };

    return {
        auth,
        api: await generateApiCtx(auth.sessionId)
    };
}

export async function generateUserAndSignIn(page: Page): Promise<{
    auth: SessionAuth;
    api: APIRequestContext;
}> {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.getByLabel('Accept Cookies').click();
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

export async function generateApiCtx(session: string | null = null): Promise<APIRequestContext> {
    return await request.newContext({
        baseURL: 'http://localhost:5173/api/',
        extraHTTPHeaders: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Cookie: session
                ? serialize(COOKIE_KEYS.sessionId, session, sessionCookieOptions(false))
                : ''
        }
    });
}
