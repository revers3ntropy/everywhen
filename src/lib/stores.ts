import type { SettingsConfig } from '$lib/controllers/settings/settings';
import { cookieWritable } from '$lib/cookieWritable';
import { localStorageWritable } from '$lib/lsWritable';
import type { SvelteComponent } from 'svelte';
import { writable } from 'svelte/store';
import { COOKIE_WRITEABLE_KEYS, STORE_KEY, Theme } from './constants';

export const popup = writable<typeof SvelteComponent | null | undefined>(null);

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
export const lastTipNumber = localStorageWritable<number, null>(STORE_KEY.lastTipNumber, 0, null);
export const obfuscated = localStorageWritable<boolean>(STORE_KEY.obfuscated, false, true);

export const theme = cookieWritable<Theme>(COOKIE_WRITEABLE_KEYS.theme, Theme.light);

export const allowedCookies = cookieWritable<boolean>(COOKIE_WRITEABLE_KEYS.allowedCookies, false);

/**
 * Called in root layout, runs on both server and client.
 * Only called when page refreshes.
 */
export function populateCookieWritablesWithCookies(
    cookies: RawCookies,
    settings: SettingsConfig | null
) {
    function tryParse<T>(value: string | undefined, defaultValue: T): T {
        if (value) {
            try {
                return JSON.parse(value) as T;
            } catch (e) {
                return defaultValue;
            }
        }
        return defaultValue;
    }

    if (cookies.theme) {
        theme.set(tryParse<Theme>(cookies.theme, Theme.light));
    }

    if (cookies.allowedCookies) {
        allowedCookies.set(tryParse<boolean>(cookies.allowedCookies, false));
    }

    if (settings?.hideEntriesByDefault?.value) {
        obfuscated.set(true);
    }

    if (settings?.preferLocationOn?.value) {
        enabledLocation.set(true);
    }
}
