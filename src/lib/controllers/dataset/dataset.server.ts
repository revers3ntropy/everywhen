import type { User } from '$lib/controllers/user/user';
import type { QueryFunc } from '$lib/db/mysql.server';
import type {
    Dataset as _Dataset,
    DatasetData,
    DatasetMetadata,
    ThirdPartyDatasetIds
} from './dataset';
import { Result } from '$lib/utils/result';
import { thirdPartyDatasetIdsToNames } from './dataset';

export type Dataset = _Dataset;

namespace DatasetUtils {
    const thirdPartyDatasetProviders: {
        [k in ThirdPartyDatasetIds]: (query: QueryFunc, user: User) => Promise<DatasetData | null>;
    } = {
        async githubCommits(_query, user) {
            if (!user.ghAccessToken) return null;
            return [];
        },
        async githubLoC(_query, user) {
            if (!user.ghAccessToken) return null;
            return [];
        }
    };

    const thirdPartyDatasetMetadataProviders: {
        [k in ThirdPartyDatasetIds]: (query: QueryFunc, user: User) => DatasetMetadata | null;
    } = {
        githubCommits(_query, user) {
            if (!user.ghAccessToken) return null;
            return {
                id: 'githubCommits',
                created: 0,
                name: thirdPartyDatasetIdsToNames.githubCommits,
                columns: []
            }
        },
        githubLoC(_query, user) {
            if (!user.ghAccessToken) return null;
            return {
                id: 'githubLoC',
                created: 0,
                name: thirdPartyDatasetIdsToNames.githubLoC,
                columns: []
            }
        }
    }

    export async function allMetaData(
        _query: QueryFunc,
        _user: User
    ): Promise<Result<DatasetMetadata[]>> {
        const metadatas = [] as DatasetMetadata[];
        for (const dataset of Object.keys(thirdPartyDatasetProviders)) {
            const metadata = thirdPartyDatasetMetadataProviders[dataset as ThirdPartyDatasetIds](_query, _user);
            if (metadata) {
                metadatas.push(metadata);
            }
        }
        return Result.ok(metadatas);
    }

    export async function fetchWholeDataset(
        query: QueryFunc,
        user: User,
        datasetId: string
    ): Promise<Result<DatasetData>> {
        const getter = thirdPartyDatasetProviders[datasetId as ThirdPartyDatasetIds];
        if (!getter) {
            return Result.err('Invalid dataset ID');
        }
        const res = await getter(query, user);
        if (res === null) {
            return Result.err('User has not connected to this dataset');
        }
        return Result.ok(res);
    }
}

export const Dataset = DatasetUtils;
