import { browser } from '$app/environment';
import type { SvelteComponentDev } from 'svelte/internal';
import { type Writable, writable } from 'svelte/store';
import { LS_KEY } from './constants';
import type { EventsSortKey } from './utils/types';

export const enabledLocation = localStorageWritable(
    LS_KEY.enabledLocation,
    false
);

export const passcodeLastEntered = localStorageWritable(
    LS_KEY.passcodeLastEntered,
    0
);
export const eventsSortKey = localStorageWritable<EventsSortKey>(
    LS_KEY.sortEventsKey,
    'created'
);
export const obfuscated = writable(false);
export const popup = writable<typeof SvelteComponentDev | null | undefined>(
    null
);

export function localStorageWritable<T>(
    lsKey: string,
    initial: T extends (...args: infer _) => infer _ ? never : T
): Writable<T> {
    if (typeof initial === 'function') {
        throw new Error(
            'localStorageWritable does not support setting a function'
        );
    }

    if (browser) {
        const lsVal = localStorage.getItem(lsKey);
        if (lsVal !== null) {
            try {
                initial = JSON.parse(lsVal) as T extends (
                    ...args: infer _
                ) => infer _
                    ? never
                    : T;
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
        set: value => {
            if (typeof value === 'function') {
                throw new Error(
                    'localStorageWritable does not support setting a function'
                );
            }
            set(value);
            if (!browser) return;
            if (value === null || value === undefined) {
                localStorage.removeItem(lsKey);
                return;
            }
            localStorage.setItem(lsKey, JSON.stringify(value));
        },
        update: fn => {
            update(value => {
                const newValue = fn(value);

                if (typeof newValue === 'function') {
                    throw new Error(
                        'localStorageWritable does not support setting a function'
                    );
                }

                if (!browser) return newValue;
                if (newValue === null || newValue === undefined) {
                    localStorage.removeItem(lsKey);
                } else {
                    localStorage.setItem(lsKey, JSON.stringify(newValue));
                }
                return newValue;
            });
        }
    };
}
