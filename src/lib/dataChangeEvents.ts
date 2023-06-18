import type { EntryFormMode } from '$lib/components/entryForm/entryFormMode';
import type { Entry } from '$lib/controllers/entry';
import { onDestroy } from 'svelte';
import type { MaybePromise } from '../app';

type Entities = 'entry';

type Create = {
    entry: {
        entry: Entry;
        entryMode: EntryFormMode;
    };
};
type Delete = {
    entry: string;
};
type Update = {
    entry: Entry;
};

type UpdateListener<T> = (newValue: T) => MaybePromise<void>;
type DelListener<T> = (value: T) => MaybePromise<void>;
type CreateListener<T> = (newValue: T) => MaybePromise<void>;
type SetupListener<Update, Delete, Create> = {
    onUpdate: (l: UpdateListener<Update>) => () => void;
    onDelete: (l: DelListener<Delete>) => () => void;
    onCreate: (l: CreateListener<Create>) => () => void;
};

const listeners: {
    [K in Entities]: Readonly<{
        onUpdate: UpdateListener<Update[K]>[];
        onDelete: DelListener<Delete[K]>[];
        onCreate: CreateListener<Create[K]>[];
    }>;
} = {
    entry: Object.freeze({ onUpdate: [], onDelete: [], onCreate: [] })
};

export const listen = (Object.keys(listeners) as Entities[]).reduce(
    (acc, key) => {
        acc[key] = {
            onUpdate(listener: UpdateListener<Update[typeof key]>) {
                listeners[key].onUpdate.push(listener);
                const remove = () => {
                    const idx = listeners[key].onUpdate.indexOf(listener);
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
                    const idx = listeners[key].onDelete.indexOf(listener);
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
                    const idx = listeners[key].onCreate.indexOf(listener);
                    if (idx !== -1) {
                        listeners[key].onCreate.splice(idx, 1);
                    }
                };
                onDestroy(remove);
                return remove;
            }
        };
        return acc;
    },
    {} as {
        [K in Entities]: SetupListener<Update[K], Delete[K], Create[K]>;
    }
);

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
