import { builtInTypes as _builtInTypes } from '$lib/controllers/dataset/columnTypes';
import type { DatasetPreset } from '$lib/controllers/dataset/presets';
import type { Hours, TimestampSecs } from '../../../types';

export interface Dataset {
    id: string;
    created: TimestampSecs;
    name: string;
    preset: DatasetPreset | null;
    rowCount: number;
    showInFeed: boolean;
}

export interface DatasetMetadata extends Dataset {
    columns: DatasetColumn<unknown>[];
}

export type DatasetData = DatasetRow[];

export interface DatasetColumnType<T> {
    id: string;
    created: TimestampSecs | null;
    name: string;
    unit: string;
    defaultValue: T;
    validate: (value: T) => boolean;
    castTo: <Q>(value: Q) => T;
}

export interface DatasetColumn<T> {
    id: string;
    datasetId: string;
    created: TimestampSecs | null;
    name: string;
    ordering: number;
    jsonOrdering: number;
    type: DatasetColumnType<T>;
}

export interface DatasetRow {
    id: number;
    created: TimestampSecs;
    timestamp: TimestampSecs;
    timestampTzOffset: Hours;
    rowJson: string;
}

export interface DecryptedDatasetRow<E extends unknown[] = unknown[]> {
    id: number;
    created: TimestampSecs;
    timestamp: TimestampSecs;
    timestampTzOffset: Hours;
    // elements should always be sorted by their 'display order'
    // NOT their 'JSON order'!
    elements: E;
}

export type DatasetDataFilter = object;

export namespace Dataset {
    export const builtInTypes = _builtInTypes;

    export function sortColumnsForJson(
        columns: DatasetColumn<unknown>[]
    ): DatasetColumn<unknown>[] {
        return [...columns].sort((a, b) => a.jsonOrdering - b.jsonOrdering);
    }

    export function sortColumnsForDisplay(
        columns: DatasetColumn<unknown>[]
    ): DatasetColumn<unknown>[] {
        return [...columns].sort((a, b) => a.ordering - b.ordering);
    }

    // maps rows from JSON-sorted to display-sorted
    export function sortRowsElementsForDisplay(
        columns: { ordering: number; jsonOrdering: number }[],
        // these rows should be sorted by their 'JSON order' NOT their 'display' order
        rows: DecryptedDatasetRow[]
    ): DecryptedDatasetRow[] {
        return rows.map(row => ({
            ...row,
            elements: new Array(columns.length).fill(null).map((_, i) => {
                const col = columns.find(c => c.ordering === i);
                if (!col) return null;
                return row.elements[col.jsonOrdering];
            })
        }));
    }

    // maps rows from display-sorted to JSON-sorted
    export function sortRowsElementsForJson(
        columns: DatasetColumn<unknown>[],
        // normal decrypted rows, sorted by their display order
        rows: DecryptedDatasetRow[]
    ): DecryptedDatasetRow[] {
        return rows.map(row => ({
            ...row,
            elements: new Array(columns.length).fill(null).map((_, i) => {
                const col = columns.find(c => c.jsonOrdering === i);
                if (!col) return null;
                return row.elements[col.ordering];
            })
        }));
    }
}
