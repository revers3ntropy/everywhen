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
    gitHubCommits: {
        id: 'gitHubCommits',
        defaultName: 'GitHub Commits',
        columns: []
    }
} satisfies Record<string, DatasetPreset>;

export type PresetId = keyof typeof datasetPresets;
