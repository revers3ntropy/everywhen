import { Settings } from '$lib/controllers/settings/settings';
import type { SettingsConfig } from '$lib/controllers/settings/settings';
import { cookieWritable } from '$lib/cookieWritable';
import type { SvelteComponent } from 'svelte';
import { writable } from 'svelte/store';
import type { EventsSortKey } from '../types';
import { COOKIE_KEYS, LS_KEYS, SESSION_KEYS, Theme } from './constants';
import { persisted } from 'svelte-local-storage-store';

// ephemeral
export const popup = writable<typeof SvelteComponent | null | undefined>(null);
export const settingsStore = writable<SettingsConfig>(Settings.fillWithDefaults({}));
export const currentlyUploadingAssets = writable<number>(0);
export const currentlyUploadingEntries = writable<number>(0);

// local storage
export const doesNotWantToEnableLocation = persisted<boolean>(
    LS_KEYS.doesNotWantToEnableLocation,
    false
);
export const enabledLocation = persisted<boolean>(LS_KEYS.enabledLocation, false);
export const passcodeLastEntered = persisted<number>(LS_KEYS.passcodeLastEntered, 0);
export const eventsSortKey = persisted<EventsSortKey>(LS_KEYS.sortEventsKey, 'created');
export const lastTipNumber = persisted<number>(LS_KEYS.lastTipNumber, 0);
export const obfuscated = persisted<boolean>(LS_KEYS.obfuscated, false);
export const navExpanded = persisted<boolean>(LS_KEYS.navbarOpen, false);

// session storage
export const username = persisted<string | null>(SESSION_KEYS.username, null);
export const encryptionKey = persisted<string | null>(SESSION_KEYS.encryptionKey, null);

// cookie
export const theme = cookieWritable<Theme>(COOKIE_KEYS.theme, Theme.light);
export const allowedCookies = cookieWritable<boolean>(COOKIE_KEYS.allowedCookies, false);

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

    if (settings) {
        settingsStore.set(settings);

        if (settings.hideEntriesByDefault?.value) {
            obfuscated.set(true);
        }

        if (settings.preferLocationOn?.value) {
            enabledLocation.set(true);
        }
    }
}
