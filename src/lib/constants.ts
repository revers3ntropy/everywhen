import type { Bytes, Milliseconds, Pixels } from '../types';

export const NORMAL_COOKIE_TIMEOUT_DAYS = 1;
export const REMEMBER_ME_COOKIE_TIMEOUT_DAYS = 365;

export const UUID_LEN = 32;

const KEY_PREFIX = '__everywhen_' as const;

export const LS_KEYS = {
    newEntryBody: `${KEY_PREFIX}new_entry_body`,
    newEntryTitle: `${KEY_PREFIX}new_entry_title`,
    newEntryLabel: `${KEY_PREFIX}new_entry_label`,
    passcodeLastEntered: `${KEY_PREFIX}passcode_last_entered`,
    enabledLocation: `${KEY_PREFIX}enabled_location`,
    sortEventsKey: `${KEY_PREFIX}events_sort_key`,
    obfuscated: `${KEY_PREFIX}obfuscated`,
    doesNotWantToEnableLocation: `${KEY_PREFIX}does_not_want_to_enable_location`,
    navbarOpen: `${KEY_PREFIX}navbar_open`
} as const;

export const SESSION_KEYS = {
    GH_CB: `${KEY_PREFIX}github_callback_state`,
    username: `${KEY_PREFIX}username`,
    encryptionKey: `${KEY_PREFIX}key`
} as const;

export enum Theme {
    light = 'light',
    dark = 'dark'
}

export const COOKIE_KEYS = {
    theme: `${KEY_PREFIX}theme`,
    allowedCookies: `${KEY_PREFIX}allowed_cookies`,
    sessionId: `${KEY_PREFIX}session_id`
} as const;

export const LS_TO_CLEAR_ON_LOGOUT = Object.freeze([
    LS_KEYS.passcodeLastEntered,
    LS_KEYS.enabledLocation,
    LS_KEYS.sortEventsKey,
    LS_KEYS.obfuscated,
    LS_KEYS.doesNotWantToEnableLocation
] as const);
export const SESSION_TO_CLEAR_ON_LOGOUT = Object.freeze([SESSION_KEYS.GH_CB]);
export const COOKIES_TO_CLEAR_ON_LOGOUT = Object.freeze([]);

// possible characters to show when the text is blurred
export const OBFUSCATE_CHARS = 'abcdefghijklmnopqrstuvwxyz ';

export const MAX_IMAGE_SIZE: Bytes = 1024 * 1024 * 8; // 8MiB

export const NAVBAR_HEIGHT: Pixels = 60;

export const ANIMATION_DURATION: Milliseconds = 200;

export const DEBUG_RENDER_COLLIDERS = false;

export const ENABLE_CACHING = true;

export const POLL_FOR_UPDATE_INTERVAL: Milliseconds = 1000 * 20;

export const LOG_FILE_NAME = 'general.log';

export const FILE_INPUT_ACCEPT_TYPES = 'image/png,image/jpeg,image/jpg,image/webp,image/svg+xml';

// all limits are inclusive
export const LIMITS = {
    asset: {
        maxCount: 1000,
        contentLenMax: 8 * 1024 * 1024,
        nameLenMin: 1,
        nameLenMax: 128
    },
    dataset: {
        maxCount: 100,
        nameLenMax: 32,
        nameLenMin: 1,
        maxAppendCount: 10_000
    },
    entry: {
        maxCount: 100_000
    },
    event: {
        maxCount: 1000,
        nameLenMax: 64,
        nameLenMin: 1
    },
    label: {
        maxCount: 100,
        nameLenMax: 64,
        nameLenMin: 1
    },
    location: {
        maxCount: 100,
        nameLenMax: 64,
        nameLenMin: 1
    },
    user: {
        passwordLenMin: 8,
        passwordLenMax: 128,
        usernameLenMin: 3,
        usernameLenMax: 64
    }
} as const;
