import type { Auth, User } from '$lib/controllers/user/user';
import type { QueryFunc } from '$lib/db/mysql.server';
import { Result } from '$lib/utils/result';
import { UUId } from '$lib/controllers/uuid/uuid.server';
import { Dataset as DatasetClient } from './dataset.client';
import type {
    Dataset as _Dataset,
    DatasetColumn,
    DatasetColumnType,
    DatasetData,
    DatasetMetadata,
    ThirdPartyDatasetIds
} from './dataset';

export type Dataset = _Dataset;

namespace DatasetUtils {
    const thirdPartyDatasetProviders: {
        [k in ThirdPartyDatasetIds]: (
            query: QueryFunc,
            user: User
        ) => MaybePromise<DatasetData | null>;
    } = {
        githubCommits(_query, user) {
            if (!user.ghAccessToken) return null;
            return [];
        },
        githubLoC(_query, user) {
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
                name: DatasetClient.thirdPartyDatasetIdsToNames.githubCommits,
                columns: []
            };
        },
        githubLoC(_query, user) {
            if (!user.ghAccessToken) return null;
            return {
                id: 'githubLoC',
                created: 0,
                name: DatasetClient.thirdPartyDatasetIdsToNames.githubLoC,
                columns: []
            };
        }
    };

    async function allTypes(query: QueryFunc, auth: Auth): Promise<Result<DatasetColumnType[]>> {
        const types = await query<
            { id: string; name: string; created: TimestampSecs; unit: string }[]
        >`
            SELECT id, name, created, unit
            FROM datasetColumnTypes
            WHERE user = ${auth.id}
        `;

        return Result.ok([...types, ...DatasetClient.builtInTypes]);
    }

    async function allColumns(query: QueryFunc, auth: Auth): Promise<Result<DatasetColumn[]>> {
        const { val: types, err: typesErr } = await allTypes(query, auth);
        if (typesErr) return Result.err(typesErr);

        const columns = await query<
            { id: string; name: string; dataset: string; created: TimestampSecs; type: string }[]
        >`
            SELECT datasetColumns.id,
                   datasetColumns.dataset,
                   datasetColumns.name,
                   datasetColumns.created,
                   datasetColumns.type
            FROM   datasetColumns, datasets
            WHERE  datasets.user = ${auth.id}
               AND datasets.id = datasetColumns.dataset
        `;

        return Result.collect(
            columns.map(column => {
                const type = types.find(type => type.id === column.type);
                if (!type) return Result.err('Invalid column type found');
                return Result.ok({
                    ...column,
                    type
                });
            })
        );
    }

    export async function allMetaData(
        query: QueryFunc,
        user: User
    ): Promise<Result<DatasetMetadata[]>> {
        const metadatas = [] as DatasetMetadata[];
        for (const dataset of Object.keys(thirdPartyDatasetProviders)) {
            const metadata = thirdPartyDatasetMetadataProviders[dataset as ThirdPartyDatasetIds](
                query,
                user
            );
            if (metadata) {
                metadatas.push(metadata);
            }
        }

        const datasets = await query<{ id: string; name: string; created: TimestampSecs }[]>`
            SELECT id, name, created
            FROM datasets
            WHERE user = ${user.id}
        `;

        const { err: columnsRes, val: columns } = await allColumns(query, user);
        if (columnsRes) return Result.err(columnsRes);

        for (const dataset of datasets) {
            metadatas.push({
                id: dataset.id,
                name: dataset.name,
                created: dataset.created,
                columns: columns.filter(column => column.dataset === dataset.id)
            });
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

    export async function create(
        query: QueryFunc,
        auth: Auth,
        name: string,
        created: TimestampSecs,
        columns: { name: string; type: string }[]
    ): Promise<Result<Dataset>> {
        if (name.length < 1) return Result.err('Name must be at least 1 character long');
        if (name.length > 100) return Result.err('Name must be at most 100 characters long');

        const existingWithName = await query<{ name: string }[]>`
            SELECT name
            FROM datasets
            WHERE name = ${name} AND user = ${auth.id}
        `;

        if (existingWithName.length > 0) {
            return Result.err('Dataset with that name already exists');
        }

        const id = await UUId.generateUniqueUUId(query);

        await query`
            INSERT INTO datasets (id, user, name, created)
            VALUES (${id}, ${auth.id}, ${name}, ${created})
        `;

        const { val: types, err: getTypesErr } = await allTypes(query, auth);
        if (getTypesErr) return Result.err(getTypesErr);

        for (const column of columns) {
            const type = types.find(type => type.id === column.type);
            if (!type) return Result.err('Invalid column type');

            const columnId = await UUId.generateUniqueUUId(query);

            await query`
                INSERT INTO datasetColumns (id, user, dataset, name, created, type)
                VALUES (${columnId}, ${auth.id}, ${id}, ${column.name}, ${created}, ${type.id})
            `;
        }

        return Result.ok({
            id,
            name,
            created
        });
    }
}

export const Dataset = DatasetUtils;
