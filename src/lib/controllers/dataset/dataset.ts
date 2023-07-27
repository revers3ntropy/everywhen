import * as client from './dataset.client';
import * as server from './dataset.server';

export interface Dataset {
    id: string;
    created: TimestampSecs;
    name: string;
}

export type ThirdPartyDatasetIds = 'githubCommits' | 'githubLoC';

export type DatasetData = DatasetRow[];

export interface DatasetColumnType {
    id: string;
    created: TimestampSecs | null;
    name: string;
    unit: string;
}

export interface DatasetColumn {
    id: string;
    dataset: string; // dataset Id
    created: TimestampSecs;
    name: string;
    type: DatasetColumnType;
}

export interface DatasetRow {
    id: string;
    created: TimestampSecs;
    timestamp: TimestampSecs;
    timestampTzOffset: Hours;
    // DatasetColumn.id -> serialized value
    elements: Record<string, string>;
}

export interface DatasetMetadata extends Dataset {
    columns: DatasetColumn[];
}

export const Dataset = {
    ...server.Dataset,
    ...client.Dataset
};
