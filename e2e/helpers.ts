import { type APIRequestContext, expect, type Page, request } from '@playwright/test';
import crypto from 'crypto-js';
import { serialize } from 'cookie';
import { sha256 } from 'js-sha256';
import cookie from 'cookie';
import dotenv from 'dotenv';
import { Result } from '../src/lib/utils/result';
import { COOKIE_KEYS, sessionCookieOptions, UUID_LEN } from '../src/lib/constants';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
global.__filename = __filename;
global.__dirname = __dirname;

dotenv.config({ path: `${__dirname}/../.env` });

const { PUBLIC_INIT_VECTOR } = process.env as Record<string, string>;
if (!PUBLIC_INIT_VECTOR) throw new Error('Missing PUBLIC_INIT_VECTOR');

export function encryptionKeyFromPassword(pass: string): string {
    return sha256(pass).substring(0, 32);
}

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

    const resCookies = cookie.parse(authRes.headers()['set-cookie']);
    const sessionId = resCookies[COOKIE_KEYS.sessionId];
    expect(typeof sessionId).toBe('string');
    expect(sessionId.length).toBe(UUID_LEN);

    const auth: SessionAuth = {
        key,
        username,
        password,
        sessionId
    };

    return {
        auth,
        api: await generateApiCtx(sessionId)
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

export async function expectDeleteUser(api: APIRequestContext): Promise<void> {
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

export function encrypt(plaintext: string, key: string | null): string {
    if (!key) throw new Error();
    const encrypted = crypto.AES.encrypt(plaintext, crypto.enc.Utf8.parse(key), {
        iv: crypto.enc.Utf8.parse(PUBLIC_INIT_VECTOR)
    });
    return crypto.enc.Hex.stringify(encrypted.ciphertext);
}

export function decrypt(ciphertext: string, key: string | null): Result<string> {
    if (!key) {
        return Result.err('Failed to decrypt data');
    }
    try {
        const decrypted = crypto.AES.decrypt(
            crypto.enc.Hex.parse(ciphertext).toString(crypto.enc.Base64),
            crypto.enc.Utf8.parse(key),
            {
                iv: crypto.enc.Utf8.parse(PUBLIC_INIT_VECTOR)
            }
        );
        const plaintext = decrypted.toString(crypto.enc.Utf8);
        return Result.ok(plaintext);
    } catch (e) {
        return Result.err('Failed to decrypt data');
    }
}
