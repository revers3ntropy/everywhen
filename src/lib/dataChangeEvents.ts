import type { AssetMetadata } from '$lib/controllers/asset/asset';
import type { DatasetColumn, DatasetMetadata, DatasetRow } from '$lib/controllers/dataset/dataset';
import type { Entry } from '$lib/controllers/entry/entry';
import type { Label } from '$lib/controllers/label/label';
import type { Event } from '$lib/controllers/event/event';
import { onDestroy } from 'svelte';
import type { MaybePromise } from '../types';

type Entities = 'entry' | 'label' | 'event' | 'asset' | 'dataset' | 'datasetCol' | 'datasetRow';

type Create = {
    entry: Entry;
    label: Label;
    event: Event;
    asset: AssetMetadata;
    dataset: DatasetMetadata;
    datasetCol: DatasetColumn<unknown>;
    datasetRow: { datasetId: string; row: DatasetRow };
};

type Delete = {
    entry: string;
    label: string;
    event: string;
    asset: string; // id
    dataset: string;
    datasetCol: { datasetId: string; columnId: string };
    datasetRow: { datasetId: string; rowId: number };
};

type Update = {
    entry: Entry;
    label: Label;
    event: Event;
    asset: AssetMetadata;
    dataset: DatasetMetadata;
    datasetCol: DatasetColumn<unknown>;
    datasetRow: { datasetId: string; row: DatasetRow };
};

type UpdateListener<T> = (newValue: T, oldValue: T) => MaybePromise<void>;
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
    asset: emptyListeners(),
    dataset: emptyListeners(),
    datasetCol: emptyListeners(),
    datasetRow: emptyListeners()
} as {
    [K in Entities]: Readonly<{
        onUpdate: UpdateListener<Update[K]>[];
        onDelete: DelListener<Delete[K]>[];
        onCreate: CreateListener<Create[K]>[];
    }>;
};

export const listen = (Object.keys(listeners) as Entities[]).reduce(
    (acc, key) => {
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
    },
    {} as Record<Entities, SetupListener<Update[Entities], Delete[Entities], Create[Entities]>>
) as {
    [K in Entities]: SetupListener<Update[K], Delete[K], Create[K]>;
};

export const dispatch = Object.freeze({
    async update<T extends Entities>(key: T, value: Update[T], oldValue: Update[T]) {
        return await Promise.all(listeners[key].onUpdate.map(l => l(value, oldValue)));
    },
    async delete<T extends Entities>(key: T, value: Delete[T]) {
        return await Promise.all(listeners[key].onDelete.map(l => l(value)));
    },
    async create<T extends Entities>(key: T, value: Create[T]) {
        return await Promise.all(listeners[key].onCreate.map(l => l(value)));
    }
} as const);
