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
                id: 0,
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
                id: 0,
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
                id: 0,
                name: 'Duration',
                created: null,
                type: builtInTypes.number,
                datasetId: ''
            },
            {
                id: 1,
                name: 'Sleep Quality',
                created: null,
                type: builtInTypes.nullableNumber,
                datasetId: ''
            },
            {
                id: 2,
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
    }
} satisfies Record<string, DatasetPreset>;

export type PresetId = keyof typeof datasetPresets;
