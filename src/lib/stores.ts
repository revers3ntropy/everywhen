import { EntryFormMode } from '$lib/components/entryForm/entryFormMode';
import { localStorageWritable } from '$lib/lsWritable';
import type { SvelteComponentDev } from 'svelte/internal';
import { writable } from 'svelte/store';
import type { EventsSortKey } from '../app';
import { LS_KEY } from './constants';

export const enabledLocation = localStorageWritable<boolean>(
    LS_KEY.enabledLocation,
    false
);

export const passcodeLastEntered = localStorageWritable<number>(
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

export const entryFormMode = localStorageWritable<EntryFormMode>(
    LS_KEY.journalingMode,
    EntryFormMode.Standard
);
