import { writable } from 'svelte/store';

export const KEY_COOKIE_KEY = '__misc_3_key_v2';
export const USERNAME_COOKIE_KEY = '__misc_3_username_v2';
export const INACTIVE_TIMEOUT_MS = 1000 * 60 * 2;

export const obfuscated = writable(false);
export const popup = writable<any>(null);
