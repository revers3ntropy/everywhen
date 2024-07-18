import { builtInTypes as _builtInTypes } from '$lib/controllers/dataset/columnTypes';
import type { DatasetPreset } from '$lib/controllers/dataset/presets';
import { datasetPresets as _datasetPresets } from '$lib/controllers/dataset/presets';
import type { Hours, TimestampSecs } from '../../../types';

export interface Dataset {
    id: string;
    created: TimestampSecs;
    name: string;
    preset: DatasetPreset | null;
}

export interface DatasetMetadata extends Dataset {
    columns: DatasetColumn<unknown>[];
    rowCount: number;
}

export type DatasetData = DatasetRow[];

export interface DatasetColumnType<T> {
    id: string;
    created: TimestampSecs | null;
    name: string;
    unit: string;
    defaultValue: T;
    validate: (value: T) => boolean;
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
}

export type DatasetPresetName = keyof typeof Dataset.datasetPresets;
