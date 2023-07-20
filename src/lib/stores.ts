import type { SettingsConfig } from '$lib/controllers/settings/settings';
import { cookieWritable } from '$lib/cookieWritable';
import type { SvelteComponent } from 'svelte';
import { writable } from 'svelte/store';
import { COOKIE_WRITEABLE_KEYS, STORE_KEY, Theme } from './constants';
import { persisted } from 'svelte-local-storage-store';

export const popup = writable<typeof SvelteComponent | null | undefined>(null);

export const doesNotWantToEnableLocation = persisted<boolean>(STORE_KEY.doesNotWantToEnableLocation, false);
export const enabledLocation = persisted<boolean>(STORE_KEY.enabledLocation, false);
export const passcodeLastEntered = persisted<number>(STORE_KEY.passcodeLastEntered, 0);
export const eventsSortKey = persisted<EventsSortKey>(STORE_KEY.sortEventsKey, 'created');
export const lastTipNumber = persisted<number>(STORE_KEY.lastTipNumber, 0);
export const obfuscated = persisted<boolean>(STORE_KEY.obfuscated, false);

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
