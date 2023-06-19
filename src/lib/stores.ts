import { localStorageWritable } from '$lib/lsWritable';
import type { SvelteComponentDev } from 'svelte/internal';
import { writable } from 'svelte/store';
import type { EventsSortKey } from '../app';
import { LS_KEY } from './constants';

export const enabledLocation = localStorageWritable<boolean, null>(
    LS_KEY.enabledLocation,
    false,
    null
);
export const passcodeLastEntered = localStorageWritable<number>(
    LS_KEY.passcodeLastEntered,
    0,
    0
);
export const eventsSortKey = localStorageWritable<EventsSortKey, null>(
    LS_KEY.sortEventsKey,
    'created',
    null
);
export const obfuscated = localStorageWritable<boolean>(
    LS_KEY.obfuscated,
    false,
    true
);

export const popup = writable<typeof SvelteComponentDev | null | undefined>(
    null
);
