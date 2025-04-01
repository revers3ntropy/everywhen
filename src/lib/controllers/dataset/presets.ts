import { builtInTypes } from '$lib/controllers/dataset/columnTypes';
import type { DatasetColumn } from '$lib/controllers/dataset/dataset';

export interface DatasetPreset {
    id: string;
    defaultName: string;
    columns: DatasetColumn<unknown>[];
}

export const datasetPresets = {
    weight: {
        id: 'weight',
        defaultName: 'Weight',
        columns: [
            {
                id: '0',
                name: 'Weight',
                created: null,
                ordering: 0,
                jsonOrdering: 0,
                type: builtInTypes.number,
                datasetId: ''
            }
        ]
    },
    happiness: {
        id: 'happiness',
        defaultName: 'Happiness',
        columns: [
            {
                id: '0',
                name: 'Happiness',
                created: null,
                ordering: 0,
                jsonOrdering: 0,
                type: builtInTypes.number,
                datasetId: ''
            }
        ]
    },
    sleep: {
        id: 'sleep',
        defaultName: 'Sleep',
        columns: [
            {
                id: '0',
                name: 'Duration',
                created: null,
                ordering: 0,
                jsonOrdering: 0,
                type: builtInTypes.number,
                datasetId: ''
            },
            {
                id: '1',
                name: 'Sleep Quality',
                created: null,
                ordering: 1,
                jsonOrdering: 1,
                type: builtInTypes.nullableNumber,
                datasetId: ''
            },
            {
                id: '2',
                name: 'Regularity',
                created: null,
                ordering: 2,
                jsonOrdering: 2,
                type: builtInTypes.nullableNumber,
                datasetId: ''
            },
            {
                id: '3',
                name: 'Time Asleep',
                created: null,
                ordering: 3,
                jsonOrdering: 3,
                type: builtInTypes.nullableNumber,
                datasetId: ''
            },
            {
                id: '4',
                name: 'Asleep After',
                created: null,
                ordering: 4,
                jsonOrdering: 4,
                type: builtInTypes.nullableNumber,
                datasetId: ''
            }
        ]
    },
    gitHubCommits: {
        id: 'gitHubCommits',
        defaultName: 'GitHub Commits',
        columns: []
    },
    weather: {
        id: 'weather',
        defaultName: 'Weather',
        columns: [
            {
                id: '0',
                name: 'Temperature',
                created: null,
                ordering: 0,
                jsonOrdering: 0,
                type: builtInTypes.number,
                datasetId: ''
            },
            {
                id: '1',
                name: 'Humidity',
                created: null,
                ordering: 1,
                jsonOrdering: 1,
                type: builtInTypes.number,
                datasetId: ''
            },
            {
                id: '2',
                name: 'Precipitation',
                created: null,
                ordering: 2,
                jsonOrdering: 2,
                type: builtInTypes.number,
                datasetId: ''
            },
            {
                id: '3',
                name: 'Cloud Cover',
                created: null,
                ordering: 3,
                jsonOrdering: 3,
                type: builtInTypes.number,
                datasetId: ''
            },
            {
                id: '4',
                name: 'Wind Speed (Max)',
                created: null,
                ordering: 4,
                jsonOrdering: 4,
                type: builtInTypes.number,
                datasetId: ''
            }
        ]
    }
} satisfies Record<string, DatasetPreset>;

export type PresetId = keyof typeof datasetPresets;
