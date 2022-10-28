import { writable } from "svelte/store";

export const KEY_COOKIE_KEY = '__misc_3_key_v1';
export const INACTIVE_TIMEOUT_MS = 1000 * 60 * 2;

export const obfuscated = writable(false);
export const popup = writable<any>(null);