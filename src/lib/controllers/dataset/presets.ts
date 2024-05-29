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
                type: builtInTypes.number,
                datasetId: ''
            }
        ]
    },
    sleepCycle: {
        id: 'sleepCycle',
        defaultName: 'Sleep Cycle',
        columns: [
            {
                id: '0',
                name: 'Duration',
                created: null,
                type: builtInTypes.number,
                datasetId: ''
            },
            {
                id: '1',
                name: 'Sleep Quality',
                created: null,
                type: builtInTypes.nullableNumber,
                datasetId: ''
            },
            {
                id: '2',
                name: 'Regularity',
                created: null,
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
                type: builtInTypes.number,
                datasetId: ''
            },
            {
                id: '1',
                name: 'Humidity',
                created: null,
                type: builtInTypes.number,
                datasetId: ''
            },
            {
                id: '2',
                name: 'Precipitation',
                created: null,
                type: builtInTypes.number,
                datasetId: ''
            },
            {
                id: '3',
                name: 'Cloud Cover',
                created: null,
                type: builtInTypes.number,
                datasetId: ''
            },
            {
                id: '4',
                name: 'Wind Speed (Max)',
                created: null,
                type: builtInTypes.number,
                datasetId: ''
            }
        ]
    }
} satisfies Record<string, DatasetPreset>;

export type PresetId = keyof typeof datasetPresets;
