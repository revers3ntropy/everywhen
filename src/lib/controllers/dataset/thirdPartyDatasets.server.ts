import type { Auth } from '$lib/controllers/auth/auth';
import type { DatasetDataFilter, DatasetRow } from '$lib/controllers/dataset/dataset';
import type { PresetId } from '$lib/controllers/dataset/presets';
import type { SettingsConfig } from '$lib/controllers/settings/settings';
import { Result } from '$lib/utils/result';
import type { Hours, TimestampSecs } from '../../../types';

export interface ThirdPartyDatasetProvider {
    fetchDataset(
        auth: Auth,
        settings: SettingsConfig,
        filter: DatasetDataFilter
    ): Promise<Result<DatasetRow[]>>;
    addRows(
        auth: Auth,
        datasetId: string,
        rows: {
            rowJson: string;
            timestamp?: TimestampSecs;
            timestampTzOffset?: Hours;
            created?: TimestampSecs;
        }[],
        onSameTimestamp: 'override' | 'append' | 'skip' | 'error'
    ): Promise<Result<number[]>>;
}

export const githubCommitsProvider = {
    async fetchDataset(): Promise<Result<DatasetRow[]>> {
        return Result.err('Not implemented');
    },
    async addRows(): Promise<Result<number[]>> {
        return Result.err('Cannot add rows');
    }
} satisfies ThirdPartyDatasetProvider;

export const weatherProvider = {
    async fetchDataset(): Promise<Result<DatasetRow[]>> {
        return Result.ok([]);
    },
    async addRows(): Promise<Result<number[]>> {
        return Result.err('Cannot add rows');
    }
} satisfies ThirdPartyDatasetProvider;

export const thirdPartyDatasetProviders: Record<PresetId, ThirdPartyDatasetProvider | null> = {
    weight: null,
    gitHubCommits: githubCommitsProvider,
    happiness: null,
    sleep: null,
    weather: weatherProvider
};
