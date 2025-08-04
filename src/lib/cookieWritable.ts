import { browser } from '$app/environment';
import { type Writable, writable } from 'svelte/store';
import Cookie from 'js-cookie';
import { CSLogger } from '$lib/controllers/logs/logger.client';

export interface CookieWritableOptions {
    cookieOptions?: Cookies.CookieAttributes;
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
                void CSLogger.error('Error parsing cookie value', { error, lsVal, cookieKey });
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
