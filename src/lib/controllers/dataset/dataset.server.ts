import type { SettingsConfig } from '$lib/controllers/settings/settings';
import type { QueryFunc } from '$lib/db/mysql.server';
import { Result } from '$lib/utils/result';
import { Dataset as DatasetClient } from './dataset.client';
import type {
    Dataset as _Dataset,
    DatasetColumn,
    DatasetColumnType,
    DatasetData,
    DatasetMetadata,
    ThirdPartyDatasetIds
} from './dataset';
import { nowUtc } from '$lib/utils/time';
import { decrypt, encrypt } from '$lib/security/encryption.server';
import type { Auth } from '$lib/controllers/auth/auth';
import { UUIdControllerServer } from '$lib/controllers/uuid/uuid.server';

export type Dataset = _Dataset;

namespace DatasetUtils {
    const thirdPartyDatasetProviders: {
        [k in ThirdPartyDatasetIds]: (
            query: QueryFunc,
            auth: Auth,
            settings: SettingsConfig
        ) => MaybePromise<DatasetData | null>;
    } = {
        githubCommits(_query, _user, settings) {
            if (!settings.gitHubAccessToken.value) return null;
            return [];
        },
        githubLoC(_query, _user, settings) {
            if (!settings.gitHubAccessToken.value) return null;
            return [];
        }
    };

    const thirdPartyDatasetMetadataProviders: {
        [k in ThirdPartyDatasetIds]: (
            query: QueryFunc,
            auth: Auth,
            settings: SettingsConfig
        ) => DatasetMetadata | null;
    } = {
        githubCommits(_query, _user, settings) {
            if (!settings.gitHubAccessToken.value) return null;
            return {
                id: 'githubCommits',
                created: 0,
                name: DatasetClient.thirdPartyDatasetIdsToNames.githubCommits,
                columns: []
            };
        },
        githubLoC(_query, _user, settings) {
            if (!settings.gitHubAccessToken.value) return null;
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

        for (const type of types) {
            const { val: decryptedName, err: decryptedNameErr } = decrypt(type.name, auth.key);
            if (decryptedNameErr) return Result.err(decryptedNameErr);
            type.name = decryptedName;

            const { val: decryptedUnit, err: decryptedUnitErr } = decrypt(type.unit, auth.key);
            if (decryptedUnitErr) return Result.err(decryptedUnitErr);
            type.unit = decryptedUnit;
        }

        return Result.ok([
            ...types.map(t => ({
                ...t,
                validate: () => true,
                serialize: JSON.stringify,
                deserialize: JSON.parse
            })),
            ...DatasetClient.builtInTypes
        ]);
    }

    async function allColumns(
        query: QueryFunc,
        auth: Auth,
        datasetId?: string
    ): Promise<Result<DatasetColumn[]>> {
        const { val: types, err: typesErr } = await allTypes(query, auth);
        if (typesErr) return Result.err(typesErr);

        const columns = await query<
            { id: number; name: string; dataset: string; created: TimestampSecs; type: string }[]
        >`
            SELECT datasetColumns.id,
                   datasetColumns.dataset,
                   datasetColumns.name,
                   datasetColumns.created,
                   datasetColumns.type
            FROM   datasetColumns, datasets
            WHERE  datasets.user = ${auth.id}
               AND datasets.id = datasetColumns.dataset
               AND ((datasets.id = ${datasetId || ''}) OR ${!datasetId})
        `;

        return Result.collect(
            columns.map(column => {
                const type = types.find(type => type.id === column.type);
                if (!type) return Result.err('Invalid column type found');

                const { val: name, err: decryptNameErr } = decrypt(column.name, auth.key);
                if (decryptNameErr) return Result.err(decryptNameErr);

                return Result.ok({
                    ...column,
                    name,
                    type
                });
            })
        );
    }

    export async function allMetaData(
        query: QueryFunc,
        auth: Auth,
        settings: SettingsConfig
    ): Promise<Result<DatasetMetadata[]>> {
        const metadatas = [] as DatasetMetadata[];
        for (const dataset of Object.keys(thirdPartyDatasetProviders)) {
            const metadata = thirdPartyDatasetMetadataProviders[dataset as ThirdPartyDatasetIds](
                query,
                auth,
                settings
            );
            if (metadata) {
                metadatas.push(metadata);
            }
        }

        const datasets = await query<{ id: string; name: string; created: TimestampSecs }[]>`
            SELECT id, name, created
            FROM datasets
            WHERE user = ${auth.id}
        `;

        const { err: columnsRes, val: columns } = await allColumns(query, auth);
        if (columnsRes) return Result.err(columnsRes);

        for (const dataset of datasets) {
            const { val: decryptedName, err: decryptedNameErr } = decrypt(dataset.name, auth.key);
            if (decryptedNameErr) return Result.err(decryptedNameErr);
            metadatas.push({
                id: dataset.id,
                name: decryptedName,
                created: dataset.created,
                columns: columns.filter(column => column.dataset === dataset.id)
            });
        }

        return Result.ok(metadatas);
    }

    export async function fetchWholeDataset(
        query: QueryFunc,
        auth: Auth,
        settings: SettingsConfig,
        datasetId: string
    ): Promise<Result<DatasetData>> {
        const provider = thirdPartyDatasetProviders[datasetId as ThirdPartyDatasetIds];
        if (!provider) {
            return Result.err('Invalid dataset ID');
        }
        const res = await provider(query, auth, settings);
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

        const encryptedName = encrypt(name, auth.key);

        const existingWithName = await query<{ name: string }[]>`
            SELECT name
            FROM datasets
            WHERE name = ${encryptedName}
              AND datasets.user = ${auth.id}
        `;

        if (existingWithName.length > 0) {
            return Result.err('Dataset with that name already exists');
        }

        const id = await UUIdControllerServer.generate();

        await query`
            INSERT INTO datasets (id, user, name, created)
            VALUES (${id}, ${auth.id}, ${encryptedName}, ${created})
        `;

        const { val: types, err: getTypesErr } = await allTypes(query, auth);
        if (getTypesErr) return Result.err(getTypesErr);

        for (let i = 0; i < columns.length; i++) {
            const column = columns[i];
            const type = types.find(type => type.id === column.type);
            if (!type) return Result.err('Invalid column type');

            const nameEncrypted = encrypt(column.name, auth.key);

            await query`
                INSERT INTO datasetColumns (id, dataset, name, created, type)
                VALUES (${i}, ${id}, ${nameEncrypted}, ${created}, ${type.id})
            `;
        }

        return Result.ok({
            id,
            name,
            created
        });
    }

    export async function appendRows(
        query: QueryFunc,
        auth: Auth,
        datasetId: string,
        rows: {
            elements: unknown[];
            created?: TimestampSecs;
            timestamp?: TimestampSecs;
            timestampTzOffset?: Hours;
        }[]
    ): Promise<Result> {
        const { val: columns, err: getColumnsErr } = await allColumns(query, auth);
        if (getColumnsErr) return Result.err(getColumnsErr);

        const newRows = [] as {
            id: number;
            created: TimestampSecs;
            timestamp: TimestampSecs;
            timestampTzOffset: Hours;
        }[];
        const newElements = [] as { row: number; column: number; data: string }[];

        const maxRowId = await query<{ id: number }[]>`
            SELECT MAX(datasetRows.id) AS id
            FROM datasetRows, datasets
            WHERE datasetRows.dataset = ${datasetId} 
                AND datasets.user = ${auth.id}
                AND datasets.id = datasetRows.dataset
        `;

        let nextRowId = maxRowId.length > 0 ? maxRowId[0].id + 1 : 0;

        for (const row of rows) {
            if (columns.length !== row.elements.length) {
                return Result.err(
                    `Invalid number of values in row: expected ${columns.length} but found ${row.elements.length}`
                );
            }

            for (let i = 0; i < columns.length; i++) {
                const column = columns[i];
                const value = row.elements[i];
                if (!column.type.validate(value)) {
                    return Result.err(
                        `Invalid value for column ${column.name}: ${JSON.stringify(value)}`
                    );
                }
            }

            const rowId = nextRowId;
            nextRowId++;

            newRows.push({
                id: rowId,
                created: row.created || nowUtc(),
                timestamp: row.timestamp || nowUtc(),
                timestampTzOffset: row.timestampTzOffset || 0
            });

            for (let i = 0; i < columns.length; i++) {
                const column = columns[i];
                const value = row.elements[i];
                const data = columns[i].type.serialize(value);
                if (data.length > 1000) {
                    return Result.err(`Value for column ${column.name} is too long`);
                }
                newElements.push({
                    row: rowId,
                    column: column.id,
                    data
                });
            }
        }

        for (const row of newRows) {
            await query`
                INSERT INTO datasetRows (id, dataset, created, timestamp, timestampTzOffset)
                VALUES (${row.id}, ${datasetId}, ${row.created}, ${row.timestamp}, ${row.timestampTzOffset})
            `;
        }
        for (const element of newElements) {
            const dataEncrypted = encrypt(element.data, auth.key);

            await query`
                INSERT INTO datasetElements (dataset, \`row\`, \`column\`, data)
                VALUES (${datasetId}, ${element.row}, ${element.column}, ${dataEncrypted})
            `;
        }

        return Result.ok(null);
    }
}

export const Dataset = DatasetUtils;
