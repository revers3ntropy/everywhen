import { builtInTypes as _builtInTypes } from '$lib/controllers/dataset/columnTypes';
import type { DatasetPreset } from '$lib/controllers/dataset/presets';
import { datasetPresets as _datasetPresets } from '$lib/controllers/dataset/presets';

export interface Dataset {
    id: string;
    created: TimestampSecs;
    name: string;
    preset: null | DatasetPreset;
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
    validate: (value: T) => boolean;
    serialize: (value: T) => string;
    deserialize: (value: string) => T;
}

export interface DatasetColumn<T> {
    id: number;
    datasetId: string;
    created: TimestampSecs;
    name: string;
    type: DatasetColumnType<T>;
}

export interface DatasetRow {
    id: number;
    timestamp: TimestampSecs;
    timestampTzOffset: Hours;
    elements: unknown[];
}

export interface DatasetDataFilter {}

export namespace Dataset {
    export const datasetPresets = _datasetPresets;
    export const builtInTypes = _builtInTypes;
}

export type DatasetPresetName = keyof typeof Dataset.datasetPresets;
