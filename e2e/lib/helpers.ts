import './config';
import { expect, type Page } from '@playwright/test';
import cookie from 'cookie';
import { sha256 } from 'js-sha256';
import { COOKIE_KEYS, UUID_LEN } from '../../src/lib/constants';
import { ApiClient } from './apiClient';

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

export async function genAuthFromUsernameAndPassword(
    username: string,
    password: string
): Promise<SessionAuth> {
    const api = await ApiClient.fromSessionId('', '');
    const key = encryptionKeyFromPassword(password);

    const authRes = await api.rawReq('get', `/auth?username=${username}&key=${key}`);
    if (!authRes.ok()) {
        throw await authRes.text();
    }

    const resCookies = cookie.parse(authRes.headers()['set-cookie']);
    const sessionId = resCookies[COOKIE_KEYS.sessionId];
    expect(typeof sessionId).toBe('string');
    expect(sessionId.length).toBeGreaterThan(UUID_LEN);

    return {
        key,
        username,
        password,
        sessionId
    };
}

export async function generateUser(): Promise<{
    auth: SessionAuth;
    api: ApiClient;
}> {
    const username = randStr();
    const password = randStr();

    const key = encryptionKeyFromPassword(password);

    const api = await ApiClient.fromSessionId('', '');

    const makeRes = await api.rawReq('post', '/users', {
        username,
        encryptionKey: key
    });
    if (!makeRes.ok()) {
        throw await makeRes.text();
    }

    const auth = await genAuthFromUsernameAndPassword(username, password);

    return {
        auth,
        api: await ApiClient.fromSessionId(auth.sessionId, key)
    };
}

export async function generateUserAndSignIn(page: Page): Promise<{
    auth: SessionAuth;
    api: ApiClient;
}> {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.getByLabel('Accept Cookies').click();
    const { auth, api } = await generateUser();

    await page.getByLabel('Username').click();
    await page.getByLabel('Username').type(auth.username);
    await page.getByLabel('Password').fill(auth.password);
    await page.getByRole('button', { name: 'Log In' }).click();

    await page.waitForURL('/journal');

    return { auth, api };
}

export async function expectDeleteUser(
    api: ApiClient,
    user: { username: string; key: string }
): Promise<void> {
    const res = await api.delete('/users', {
        username: user.username,
        encryptionKey: user.key
    });
    expect(res.ok).toBe(true);
}
