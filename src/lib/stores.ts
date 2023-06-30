import { cookieWritable } from '$lib/cookieWritable';
import { localStorageWritable } from '$lib/lsWritable';
import type { SvelteComponent } from 'svelte';
import { writable } from 'svelte/store';
import {
    COOKIE_WRITEABLE_DEFAULTS,
    COOKIE_WRITEABLE_KEYS,
    STORE_KEY,
    type Theme
} from './constants';

export const enabledLocation = localStorageWritable<boolean, null>(
    STORE_KEY.enabledLocation,
    false,
    null
);
export const passcodeLastEntered = localStorageWritable<number>(
    STORE_KEY.passcodeLastEntered,
    0,
    0
);
export const eventsSortKey = localStorageWritable<EventsSortKey, null>(
    STORE_KEY.sortEventsKey,
    'created',
    null
);
export const obfuscated = localStorageWritable<boolean>(STORE_KEY.obfuscated, false, true);

export const popup = writable<typeof SvelteComponent | null | undefined>(null);

export const theme = cookieWritable<Theme>(
    COOKIE_WRITEABLE_KEYS.theme,
    COOKIE_WRITEABLE_DEFAULTS.theme
);

export function populateCookieWritablesWithCookies(cookies: RawCookies) {
    theme.set(JSON.parse(cookies.theme) as Theme);
}
