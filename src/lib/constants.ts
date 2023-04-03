import type { Bytes, Pixels, Seconds } from './utils/types';

export const COOKIE_TIMEOUT: Seconds = 60 * 60;
export const KEY_COOKIE_KEY = '__misc_3_key_v2';
export const USERNAME_COOKIE_KEY = '__misc_3_username_v2';

export const LS_KEY = {
    newEntryBody: '__misc_3_newEntryBody',
    newEntryTitle: '__misc_3_newEntryTitle',
    newEntryLabel: '__misc_3_newEntryLabel',
}

// possible characters to show when the text is blurred
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

export const MAX_IMAGE_SIZE: Bytes = 1024 * 1024 * 4; // 4MiB

export const EVENT_IN_TIMELINE_HEIGHT: Pixels = 30;

export const NAVBAR_HEIGHT: Pixels = 60;