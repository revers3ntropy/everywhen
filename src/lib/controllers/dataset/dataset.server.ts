import { MAXIMUM_ENTITIES } from '$lib/constants';
import type { SettingsConfig } from '$lib/controllers/settings/settings';
import { query } from '$lib/db/mysql.server';
import { Result } from '$lib/utils/result';
import {
    Dataset as _Dataset,
    type DatasetColumn,
    type DatasetColumnType,
    type DatasetData,
    type DatasetMetadata,
    type ThirdPartyDatasetIds
} from './dataset';
import { nowUtc } from '$lib/utils/time';
import { decrypt, encrypt } from '$lib/utils/encryption';
import type { Auth } from '$lib/controllers/auth/auth';
import { UId } from '$lib/controllers/uuid/uuid.server';

namespace DatasetServer {
    const Dataset = _Dataset;
    type Dataset = _Dataset;

    function allTypes(): Result<Record<string, DatasetColumnType<unknown>>> {
        return Result.ok(Dataset.builtInTypes);
    }

    async function allColumns(auth: Auth, datasetId?: string): Promise<Result<DatasetColumn[]>> {
        const { val: types, err: typesErr } = allTypes();
        if (typesErr) return Result.err(typesErr);

        const columns = await query<
            {
                id: number;
                name: string;
                datasetId: string;
                created: TimestampSecs;
                typeId: string;
            }[]
        >`
            SELECT datasetColumns.id,
                   datasetColumns.datasetId,
                   datasetColumns.name,
                   datasetColumns.created,
                   datasetColumns.typeId
            FROM   datasetColumns, datasets
            WHERE  datasets.userId = ${auth.id}
               AND datasets.id = datasetColumns.datasetId
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
        auth: Auth,
        settings: SettingsConfig
    ): Promise<Result<DatasetMetadata[]>> {
        const metadatas = [] as DatasetMetadata[];
        for (const dataset of Object.keys(thirdPartyDatasetProviders)) {
            const metadata = thirdPartyDatasetMetadataProviders[dataset as ThirdPartyDatasetIds](
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

        const { err: columnsRes, val: columns } = await allColumns(auth);
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
        auth: Auth,
        settings: SettingsConfig,
        datasetId: string
    ): Promise<Result<DatasetData>> {
        const provider = thirdPartyDatasetProviders[datasetId as ThirdPartyDatasetIds];
        if (!provider) {
            return Result.err('Invalid dataset ID');
        }
        const res = await provider(auth, settings);
        if (res === null) {
            return Result.err('User has not connected to this dataset');
        }
        return Result.ok(res);
    }

    async function canCreateWithName(auth: Auth, namePlaintext: string): Promise<string | true> {
        if (namePlaintext.length < 1) {
            return 'Name must be at least 1 character long';
        }
        if (namePlaintext.length > 100) {
            return 'Name must be at most 100 characters long';
        }

        const numDatasets = await query<{ count: number }[]>`
            SELECT COUNT(*) AS count
            FROM datasets
            WHERE datasets.user = ${auth.id}
        `;
        if (numDatasets[0].count >= MAXIMUM_ENTITIES.dataset) {
            return `Maximum number of datasets (${MAXIMUM_ENTITIES.dataset}) reached`;
        }

        const encryptedName = encrypt(namePlaintext, auth.key);

        const existingWithName = await query<{ name: string }[]>`
            SELECT name
            FROM datasets
            WHERE name = ${encryptedName}
              AND datasets.user = ${auth.id}
        `;
        if (existingWithName.length > 0) {
            return 'Dataset with that name already exists';
        }

        return true;
    }

    export async function create(
        auth: Auth,
        name: string,
        created: TimestampSecs,
        columns: { name: string; type: string }[]
    ): Promise<Result<Dataset>> {
        const id = await UId.Server.generate();

        const canCreate = await canCreateWithName(auth, name);
        if (canCreate !== true) return Result.err(canCreate);

        await query`
            INSERT INTO datasets (id, user, name, created)
            VALUES (${id}, ${auth.id}, ${encrypt(name, auth.key)}, ${created})
        `;

        const { val: types, err: getTypesErr } = allTypes();
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
        auth: Auth,
        datasetId: string,
        rows: {
            elements: unknown[];
            timestamp?: TimestampSecs;
            timestampTzOffset?: Hours;
        }[]
    ): Promise<Result<null>> {
        const { val: columns, err: getColumnsErr } = await allColumns(auth);
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
            WHERE datasetRows.datasetId = ${datasetId} 
                AND datasets.userId = ${auth.id}
                AND datasets.id = datasetRows.datasetId
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

export const Dataset = {
    ..._Dataset,
    Server: DatasetServer
};
export type Dataset = _Dataset;
export type {
    DatasetColumn,
    DatasetColumnType,
    DatasetData,
    DatasetMetadata,
    ThirdPartyDatasetIds
} from './dataset';
