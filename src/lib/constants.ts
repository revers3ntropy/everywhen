import type { Bytes, Milliseconds, Pixels, Seconds } from './utils/types';

export const COOKIE_TIMEOUT: Seconds = 60 * 60;
export const KEY_COOKIE_KEY = '__misc_3_key_v2';
export const USERNAME_COOKIE_KEY = '__misc_3_username_v2';

export const LS_KEY = {
    newEntryBody: '__misc_3_newEntryBody',
    newEntryTitle: '__misc_3_newEntryTitle',
    newEntryLabel: '__misc_3_newEntryLabel',
    passcodeLastEntered: '__misc_3_passcode_last_entered',
    enabledLocation: '__misc_3_enabled_location',
    sortEventsKey: '__misc_3_events_sort_key'
};

// possible characters to show when the text is blurred
export const OBFUSCATE_CHARS = 'abcdefghijklmnopqrstuvwxyz ';

export const KEY_COOKIE_OPTIONS = Object.freeze({
    path: '/',
    maxAge: COOKIE_TIMEOUT,
    sameSite: 'strict',
    httpOnly: true
});

// allow the username cookie to be read by the client
// so that it can check the auth is still valid
// but keep the key cookie httpOnly, to prevent XSS
// https://owasp.org/www-community/HttpOnly
export const USERNAME_COOKIE_OPTIONS = Object.freeze({
    ...KEY_COOKIE_OPTIONS,
    httpOnly: false
});

export const NON_AUTH_ROUTES = Object.freeze([
    '/',
    '/about',
    '/about/history',
    '/signup'
]);

export const NO_SIGNED_IN_ROUTES = Object.freeze(['/signup', '/']);

export const MAX_IMAGE_SIZE: Bytes = 1024 * 1024 * 8; // 8MiB

export const NAVBAR_HEIGHT: Pixels = 60;

export const ANIMATION_DURATION: Milliseconds = 200;

export const API_DOCS_LINK =
    'https://docs.google.com/spreadsheets/d/1eLjbfXnzAXRz08qJPRGnM_IsezMKcuT6anuy_qwP-Uo/edit?usp=sharing';

export const DEBUG_RENDER_COLLIDERS = false;

export const ENABLE_CACHING = true;
