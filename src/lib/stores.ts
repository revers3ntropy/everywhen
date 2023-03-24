import { browser } from '$app/environment';
import type { SvelteComponentDev } from 'svelte/internal';
import { type Writable, writable } from 'svelte/store';
import type { EventsSortKey } from './utils/types';

export const enabledLocation = localStorageWritable(
    '__misc_3_enabled_location', false);
export const passcodeLastEntered = localStorageWritable(
    '__misc_3_passcode_last_entered', 0);
export const eventsSortKey = localStorageWritable<EventsSortKey>(
    '__misc_3_events_sort_key', 'created',
);
export const obfuscated = writable(false);
export const popup = writable<typeof SvelteComponentDev | null | undefined>(null);

export function localStorageWritable<T> (
    lsKey: string,
    initial: T extends Function ? never : T,
): Writable<T> {

    if (typeof initial === 'function') {
        throw new Error('localStorageWritable does not support setting a function');
    }

    if (browser) {
        const lsVal = localStorage.getItem(lsKey);
        if (lsVal !== null) {
            try {
                initial = JSON.parse(lsVal) as T extends Function ? never : T;
            } catch (e) {
                console.error('Error parsing localStorage value', e);
            }
        }

        localStorage.setItem(lsKey, JSON.stringify(initial));
    }

    const store = writable<T>(initial);

    const { subscribe, set, update } = store;

    return {
        subscribe,
        set: (value) => {
            if (typeof value === 'function') {
                throw new Error('localStorageWritable does not support setting a function');
            }
            set(value);
            if (!browser) return;
            if (value === null || value === undefined) {
                localStorage.removeItem(lsKey);
                return;
            }
            localStorage.setItem(lsKey, JSON.stringify(value));
        },
        update: (fn) => {
            update((value) => {
                const newValue = fn(value);

                if (typeof newValue === 'function') {
                    throw new Error('localStorageWritable does not support setting a function');
                }

                if (!browser) return newValue;
                if (newValue === null || newValue === undefined) {
                    localStorage.removeItem(lsKey);
                } else {
                    localStorage.setItem(lsKey, JSON.stringify(newValue));
                }
                return newValue;
            });
        },
    };
}
