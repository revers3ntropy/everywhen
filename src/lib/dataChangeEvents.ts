import type { EntryFormMode } from '$lib/components/entryForm/entryFormMode';
import type { Entry } from '$lib/controllers/entry';
import type { Label } from '$lib/controllers/label';
import type { Event } from '$lib/controllers/event';
import type { SettingsConfig } from '$lib/controllers/settings';
import { onDestroy } from 'svelte';

type Entities = 'entry' | 'label' | 'event' | 'setting';

type Create = {
    entry: {
        entry: Entry;
        entryMode: EntryFormMode;
    };
    label: Label;
    event: Event;
    setting: never;
};
type Delete = {
    entry: string;
    label: string;
    event: string;
    setting: never;
};
type Update = {
    entry: Entry;
    label: Label;
    event: Event;
    setting: {
        key: keyof SettingsConfig;
        value: SettingsConfig[keyof SettingsConfig]['value'];
    };
};

type UpdateListener<T> = (newValue: T) => MaybePromise<void>;
type DelListener<T> = (value: T) => MaybePromise<void>;
type CreateListener<T> = (newValue: T) => MaybePromise<void>;
type SetupListener<Update, Delete, Create> = {
    onUpdate: (l: UpdateListener<Update>) => () => void;
    onDelete: (l: DelListener<Delete>) => () => void;
    onCreate: (l: CreateListener<Create>) => () => void;
};

function emptyListeners(): Readonly<{
    onUpdate: never[];
    onDelete: never[];
    onCreate: never[];
}> {
    return Object.freeze({ onUpdate: [], onDelete: [], onCreate: [] });
}

const listeners = {
    entry: emptyListeners(),
    label: emptyListeners(),
    event: emptyListeners(),
    setting: emptyListeners()
} as {
    [K in Entities]: Readonly<{
        onUpdate: UpdateListener<Update[K]>[];
        onDelete: DelListener<Delete[K]>[];
        onCreate: CreateListener<Create[K]>[];
    }>;
};

export const listen = (Object.keys(listeners) as Entities[]).reduce((acc, key) => {
    acc[key] = {
        onUpdate(listener: UpdateListener<Update[typeof key]>) {
            listeners[key].onUpdate.push(listener);
            const remove = () => {
                const idx = (listeners[key].onUpdate as unknown[]).indexOf(listener);
                if (idx !== -1) {
                    listeners[key].onUpdate.splice(idx, 1);
                }
            };
            onDestroy(remove);
            return remove;
        },
        onDelete(listener: DelListener<Delete[typeof key]>) {
            listeners[key].onDelete.push(listener);
            const remove = () => {
                const idx = (listeners[key].onDelete as unknown[]).indexOf(listener);
                if (idx !== -1) {
                    listeners[key].onDelete.splice(idx, 1);
                }
            };
            onDestroy(remove);
            return remove;
        },
        onCreate(listener: CreateListener<Create[typeof key]>) {
            listeners[key].onCreate.push(listener);
            const remove = () => {
                const idx = (listeners[key].onCreate as unknown[]).indexOf(listener);
                if (idx !== -1) {
                    listeners[key].onCreate.splice(idx, 1);
                }
            };
            onDestroy(remove);
            return remove;
        }
    };
    return acc;
}, {} as Record<Entities, SetupListener<Update[Entities], Delete[Entities], Create[Entities]>>) as {
    [K in Entities]: SetupListener<Update[K], Delete[K], Create[K]>;
};

export const dispatch = Object.freeze({
    async update<T extends Entities>(key: T, value: Update[T]) {
        return await Promise.all(listeners[key].onUpdate.map(l => l(value)));
    },
    async delete<T extends Entities>(key: T, value: Delete[T]) {
        return await Promise.all(listeners[key].onDelete.map(l => l(value)));
    },
    async create<T extends Entities>(key: T, value: Create[T]) {
        return await Promise.all(listeners[key].onCreate.map(l => l(value)));
    }
} as const);
