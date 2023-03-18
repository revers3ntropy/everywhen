import type { Milliseconds, Seconds } from './utils/types';

export const INACTIVE_TIMEOUT_MS: Milliseconds = 1000 * 60 * 2;
export const COOKIE_TIMEOUT: Seconds = 60 * 60;
export const KEY_COOKIE_KEY = '__misc_3_key_v2';
export const USERNAME_COOKIE_KEY = '__misc_3_username_v2';

export const OBFUSCATE_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz ';

export const KEY_COOKIE_OPTIONS = Object.freeze({
    path: '/',
    maxAge: COOKIE_TIMEOUT,
    sameSite: 'strict',
    httpOnly: true,
});

// allow the username cookie to be read by the client
// so that it can check the auth is still valid
// but keep the key cookie httpOnly, to prevent XSS
// https://owasp.org/www-community/HttpOnly
export const USERNAME_COOKIE_OPTIONS = Object.freeze({
    ...KEY_COOKIE_OPTIONS,
    httpOnly: false,
});