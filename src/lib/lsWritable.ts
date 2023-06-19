import { browser } from '$app/environment';
import { errorLogger } from '$lib/utils/log';
import { type Writable, writable } from 'svelte/store';

/**
 * Automatically persists a writable store in localStorage.
 * Uses null as loading value for before the initial value is set.
 */
export function localStorageWritable<T, S = T>(
    lsKey: string,
    initial: T,
    serverSideInitial: S
): Writable<T | S> {
    if (typeof initial === 'function') {
        throw new Error(
            'localStorageWritable does not support setting a function'
        );
    }

    let initialValue: T | S = initial;

    if (browser) {
        const lsVal = localStorage.getItem(lsKey);
        if (lsVal !== null) {
            try {
                initialValue = JSON.parse(lsVal) as T;
            } catch (e) {
                errorLogger.error('Error parsing localStorage value', e);
            }
        }

        localStorage.setItem(lsKey, JSON.stringify(initialValue));
    } else {
        // null for when on server, e.g. the loading state
        initialValue = serverSideInitial;
    }

    const store = writable<T | S>(initialValue);

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
