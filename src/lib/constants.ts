export const COOKIE_TIMEOUT: Seconds = 60 * 60 * 24 * 3;

export const KEY_PREFIX = '__halcyon_land_';

export const STORE_KEY = {
    newEntryBody: `${KEY_PREFIX}new_entry_body`,
    newEntryTitle: `${KEY_PREFIX}new_entry_title`,
    newEntryLabel: `${KEY_PREFIX}new_entry_label`,
    passcodeLastEntered: `${KEY_PREFIX}passcode_last_entered`,
    enabledLocation: `${KEY_PREFIX}enabled_location`,
    sortEventsKey: `${KEY_PREFIX}events_sort_key`,
    key: `${KEY_PREFIX}key`,
    username: `${KEY_PREFIX}username`,
    obfuscated: `${KEY_PREFIX}obfuscated`
} as const;

export enum Theme {
    light = 'light',
    dark = 'dark'
}

export const COOKIE_WRITEABLE_KEYS = {
    theme: `${KEY_PREFIX}theme`,
    allowedCookies: `${KEY_PREFIX}allowed_cookies`
} as const;

export const LS_TO_CLEAR_ON_LOGOUT = Object.freeze([
    STORE_KEY.newEntryBody,
    STORE_KEY.newEntryTitle,
    STORE_KEY.newEntryLabel,
    STORE_KEY.passcodeLastEntered,
    STORE_KEY.enabledLocation,
    STORE_KEY.sortEventsKey,
    STORE_KEY.obfuscated
]);

export const COOKIES_TO_CLEAR_ON_LOGOUT = Object.freeze([]);

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

export const MAX_IMAGE_SIZE: Bytes = 1024 * 1024 * 8; // 8MiB

export const NAVBAR_HEIGHT: Pixels = 60;

export const ANIMATION_DURATION: Milliseconds = 200;

export const API_DOCS_LINK =
    'https://docs.google.com/spreadsheets/d/1eLjbfXnzAXRz08qJPRGnM_IsezMKcuT6anuy_qwP-Uo/edit?usp=sharing';

export const DEBUG_RENDER_COLLIDERS = false;

export const ENABLE_CACHING = true;

export const POLL_FOR_UPDATE_INTERVAL: Milliseconds = 1000 * 15;

export const LOG_FILE_NAME = 'general.log';
