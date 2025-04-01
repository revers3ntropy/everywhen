import { builtInTypes as _builtInTypes } from '$lib/controllers/dataset/columnTypes';
import type { DatasetPreset } from '$lib/controllers/dataset/presets';
import { datasetPresets as _datasetPresets } from '$lib/controllers/dataset/presets';
import type { Hours, TimestampSecs } from '../../../types';

export interface Dataset {
    id: string;
    created: TimestampSecs;
    name: string;
    preset: DatasetPreset | null;
    rowCount: number;
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

export interface DatasetRow<E extends unknown[] = unknown[]> {
    id: number;
    created: TimestampSecs;
    timestamp: TimestampSecs;
    timestampTzOffset: Hours;
    elements: E;
}

export type DatasetDataFilter = object;

export namespace Dataset {
    export const datasetPresets = _datasetPresets;
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

    export function sortRowsElementsForDisplay(
        columns: DatasetColumn<unknown>[],
        rows: DatasetRow[]
    ): DatasetRow[] {
        return rows.map(row => ({
            ...row,
            elements: new Array(columns.length).fill(null).map((_, i) => {
                const col = columns.find(c => c.ordering === i);
                if (!col) return null;
                return row.elements[col.jsonOrdering];
            })
        }));
    }
}

export type DatasetPresetName = keyof typeof Dataset.datasetPresets;
