import { writable } from 'svelte/store';
import { localStorageWritable, type Milliseconds } from './utils';

export const INACTIVE_TIMEOUT_MS: Milliseconds = 1000 * 60 * 2;
export const KEY_COOKIE_KEY = '__misc_3_key_v2';
export const USERNAME_COOKIE_KEY = '__misc_3_username_v2';
export const enabledLocation = localStorageWritable(
    '__misc_3_enabled_location', false);
export const obfuscated = writable(false);

export const popup = writable<unknown>(null);

export const AUTH_COOKIE_OPTIONS = Object.freeze({
    path: '/',
    maxAge: 60 * 60, // one hour, but will be refreshed on every request
    sameSite: 'strict',
    httpOnly: true,
});

export const OBFUSCATE_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz ';
