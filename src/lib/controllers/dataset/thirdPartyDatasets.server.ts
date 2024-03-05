import type { Auth } from '$lib/controllers/auth/auth';
import type { DatasetDataFilter, DatasetRow } from '$lib/controllers/dataset/dataset';
import type { PresetId } from '$lib/controllers/dataset/presets';
import type { SettingsConfig } from '$lib/controllers/settings/settings';
import { Result } from '$lib/utils/result';

export interface ThirdPartyDatasetProvider {
    fetchDataset: (
        auth: Auth,
        settings: SettingsConfig,
        filter: DatasetDataFilter
    ) => Promise<Result<DatasetRow[]>>;
}

export const githubCommitsProvider = {
    fetchDataset(): Promise<Result<DatasetRow[]>> {
        return Promise.resolve(Result.err('Not implemented'));
    }
} satisfies ThirdPartyDatasetProvider;

export const weatherProvider = {
    fetchDataset(): Promise<Result<DatasetRow[]>> {
        return Promise.resolve(Result.err('Not implemented'));
    }
} satisfies ThirdPartyDatasetProvider;

export const thirdPartyDatasetProviders: Record<PresetId, ThirdPartyDatasetProvider | null> = {
    weight: null,
    gitHubCommits: githubCommitsProvider,
    happiness: null,
    sleepCycle: null,
    weather: weatherProvider
};
