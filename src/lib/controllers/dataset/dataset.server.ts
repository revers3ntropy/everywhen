import type { User } from '$lib/controllers/user/user';
import type { QueryFunc } from '$lib/db/mysql.server';
import type { Dataset as _Dataset, DatasetData, DatasetMetadata, ThirdPartyDatasetIds } from './dataset';
import { Result } from "$lib/utils/result";
import { thirdPartyDatasetIdsToNames } from "./dataset";

export type Dataset = _Dataset;

namespace DatasetUtils {

    const thirdPartyDatasetGetters: { [k in ThirdPartyDatasetIds]: (query: QueryFunc, user: User) => Promise<DatasetData> } = {
        get githubCommits () {
            return async function (_query: QueryFunc, _user: User): Promise<DatasetData> {
                return [];
            };
        },
        get githubLoC () {
            return async function (_query: QueryFunc, _user: User): Promise<DatasetData> {
                return [];
            };
        }
    }

    export async function allMetaData (_query: QueryFunc, _user: User): Promise<Result<DatasetMetadata[]>> {
        const metadata = [] as DatasetMetadata[];
        for (const dataset of Object.keys(thirdPartyDatasetGetters)) {
            metadata.push({
                id: dataset,
                created: 0,
                name: thirdPartyDatasetIdsToNames[dataset as ThirdPartyDatasetIds],
                columns: [],
            });
        }
        return Result.ok(metadata);
    }

    export async function fetchWholeDataset (query: QueryFunc, user: User, datasetId: string): Promise<Result<DatasetData>> {
        const getter = thirdPartyDatasetGetters[datasetId as ThirdPartyDatasetIds];
        if (!getter) {
            return Result.err('Invalid dataset ID');
        }
        return Result.ok(await getter(query, user));
    }
}

export const Dataset = DatasetUtils;
