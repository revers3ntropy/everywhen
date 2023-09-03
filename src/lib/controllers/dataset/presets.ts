import { builtInTypes } from '$lib/controllers/dataset/columnTypes';
import type { DatasetColumn } from '$lib/controllers/dataset/dataset';
import { githubCommitsProvider } from '$lib/controllers/dataset/thirdPartyDatasets.server';
import type { ThirdPartyDatasetProvider } from '$lib/controllers/dataset/thirdPartyDatasets.server';

export interface DatasetPreset {
    id: string;
    defaultName: string;
    columns: DatasetColumn<unknown>[];
    thirdPartyProvider?: ThirdPartyDatasetProvider;
}

export const datasetPresets: Record<string, DatasetPreset> = {
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
        columns: [],
        thirdPartyProvider: githubCommitsProvider
    }
};

export type PresetId = keyof typeof datasetPresets;
