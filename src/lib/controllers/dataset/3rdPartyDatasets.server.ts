import type { Auth } from '$lib/controllers/auth/auth';
import type { DatasetDataFilter, DatasetRow } from '$lib/controllers/dataset/dataset';
import type { DatasetPreset } from '$lib/controllers/dataset/presets';
import type { SettingsConfig } from '$lib/controllers/settings/settings';

export type ThirdPartyDatasetIds = 'githubCommits' | 'githubLoC';

interface ThirdPartyDatasetProvider {
    id: string;
    name: string;
    description: string;
    preset: DatasetPreset;
    fetchDataset: (
        auth: Auth,
        settings: SettingsConfig,
        filter: DatasetDataFilter
    ) => Promise<DatasetRow[]>;
}

export const thirdPartyDatasets = {
    githubCommits: {
        id: 'githubCommits',
        name: 'GitHub Commits',
        description: 'Commits to a GitHub repository',
        preset: {
            id: 'githubCommits',
            columns: []
        },
        fetchDataset() {
            throw new Error('Not implemented');
        }
    },
    githubLoC: {
        id: 'githubLoC',
        name: 'GitHub Lines of Code',
        description: 'Lines of code in a GitHub repository',
        preset: {
            id: 'githubLoC',
            columns: []
        },
        fetchDataset() {
            throw new Error('Not implemented');
        }
    }
} satisfies Record<ThirdPartyDatasetIds, ThirdPartyDatasetProvider>;
