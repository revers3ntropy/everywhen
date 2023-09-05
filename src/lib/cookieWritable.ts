import { browser } from '$app/environment';
import { clientLogger } from '$lib/utils/log';
import { type Writable, writable } from 'svelte/store';
import Cookie from 'js-cookie';

export interface CookieWritableOptions {
    cookieOptions?: Cookie.CookieAttributes;
}

/**
 * Automatically persists a writable store to cookies.
 */
export function cookieWritable<T>(
    cookieKey: string,
    initial: T,
    {
        cookieOptions = {
            expires: 365,
            secure: true,
            sameSite: 'lax'
        }
    }: CookieWritableOptions = {}
): Writable<T> {
    if (typeof initial === 'function') {
        throw new Error('cookieWritable does not support setting a function');
    }

    let initialValue = initial;

    if (browser) {
        const lsVal = Cookie.get(cookieKey);
        if (lsVal !== undefined) {
            try {
                initialValue = JSON.parse(lsVal) as T;
            } catch (error) {
                clientLogger.error('Error parsing cookie value', { error, lsVal, cookieKey });
            }
        }

        if (initialValue === null || initialValue === undefined) {
            Cookie.remove(cookieKey);
        } else {
            Cookie.set(cookieKey, JSON.stringify(initialValue), cookieOptions);
        }
    }

    const store = writable<T>(initialValue);

    const { subscribe, set, update } = store;

    return {
        subscribe,
        set: value => {
            if (typeof value === 'function') {
                throw new Error('cookieWritable does not support setting a function');
            }
            set(value);
            if (!browser) return;
            if (value === null || value === undefined) {
                Cookie.remove(cookieKey);
                return;
            }
            Cookie.set(cookieKey, JSON.stringify(value), cookieOptions);
        },
        update: fn => {
            update(value => {
                const newValue = fn(value);

                if (typeof newValue === 'function') {
                    throw new Error('cookieWritable does not support setting a function');
                }

                if (!browser) return newValue;
                if (newValue === null || newValue === undefined) {
                    Cookie.remove(cookieKey);
                } else {
                    Cookie.set(cookieKey, JSON.stringify(newValue), cookieOptions);
                }
                return newValue;
            });
        }
    };
}
