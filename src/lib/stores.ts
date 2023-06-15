import { EntryFormMode } from '$lib/components/entryForm/entryFormMode';
import { localStorageWritable } from '$lib/lsWritable';
import type { SvelteComponentDev } from 'svelte/internal';
import { writable } from 'svelte/store';
import type { EventsSortKey } from '../app';
import { LS_KEY } from './constants';
import type { Entry } from '$lib/controllers/entry';

export const enabledLocation = localStorageWritable(
    LS_KEY.enabledLocation,
    false
);

export const passcodeLastEntered = localStorageWritable(
    LS_KEY.passcodeLastEntered,
    0 as number
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

export const addEntryListeners = writable<
    ((e: Entry, mode: EntryFormMode) => void)[]
>([]);
