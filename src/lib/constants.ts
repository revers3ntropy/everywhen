import type { Milliseconds } from './utils/types';

export const INACTIVE_TIMEOUT_MS: Milliseconds = 1000 * 60 * 2;
export const KEY_COOKIE_KEY = '__misc_3_key_v2';
export const USERNAME_COOKIE_KEY = '__misc_3_username_v2';

export const OBFUSCATE_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz ';

export const AUTH_COOKIE_OPTIONS = Object.freeze({
    path: '/',
    maxAge: 60 * 60, // one hour, but will be refreshed on every request
    sameSite: 'strict',
    httpOnly: true,
});