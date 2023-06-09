import type { Bytes, Milliseconds, Pixels, Seconds } from '../app';

export const COOKIE_TIMEOUT: Seconds = 60 * 60;
export const KEY_COOKIE_KEY = '__misc_3_key_v2';
export const USERNAME_COOKIE_KEY = '__misc_3_username_v2';

const LS_PREFIX = '__misc_3_';
export const LS_KEY = {
    newEntryBody: `${LS_PREFIX}new_entry_body`,
    newEntryTitle: `${LS_PREFIX}new_entry_title`,
    newEntryLabel: `${LS_PREFIX}new_entry_label`,
    passcodeLastEntered: `${LS_PREFIX}passcode_last_entered`,
    enabledLocation: `${LS_PREFIX}enabled_location`,
    sortEventsKey: `${LS_PREFIX}events_sort_key`,
    journalingMode: `${LS_PREFIX}journaling_mode`
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
