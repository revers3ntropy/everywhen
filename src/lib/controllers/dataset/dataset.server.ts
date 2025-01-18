import { LIMITS } from '$lib/constants';
import type { DatasetPreset, PresetId } from '$lib/controllers/dataset/presets';
import { datasetPresets } from '$lib/controllers/dataset/presets';
import { thirdPartyDatasetProviders } from '$lib/controllers/dataset/thirdPartyDatasets.server';
import type { ThirdPartyDatasetProvider } from '$lib/controllers/dataset/thirdPartyDatasets.server';
import type { SettingsConfig } from '$lib/controllers/settings/settings';
import { query } from '$lib/db/mysql.server';
import { range } from '$lib/utils';
import { FileLogger } from '$lib/utils/log.server';
import { Result } from '$lib/utils/result';
import type { Hours, TimestampSecs } from '../../../types';
import type { DatasetDataFilter } from './dataset';
import {
    Dataset as _Dataset,
    type DatasetColumn,
    type DatasetColumnType,
    type DatasetData,
    type DatasetMetadata
} from './dataset';
import { nowUtc } from '$lib/utils/time';
import { decrypt, encrypt } from '$lib/utils/encryption';
import type { Auth } from '$lib/controllers/auth/auth';
import { UId } from '$lib/controllers/uuid/uuid.server';

const logger = new FileLogger('Dataset');

namespace DatasetServer {
    const Dataset = _Dataset;
    type Dataset = _Dataset;

    function allTypes(): Result<Record<string, DatasetColumnType<unknown>>> {
        return Result.ok(Dataset.builtInTypes);
    }

    async function getUserDefinedColumns(
        auth: Auth,
        datasetId?: string
    ): Promise<Result<DatasetColumn<unknown>[]>> {
        const typesRes = allTypes();
        if (!typesRes.ok) return typesRes.cast();

        const columns = await query<
            {
                id: string;
                name: string;
                datasetId: string;
                created: TimestampSecs;
                ordering: number;
                jsonOrdering: number;
                typeId: string;
            }[]
        >`
            SELECT datasetColumns.id,
                   datasetColumns.datasetId,
                   datasetColumns.name,
                   datasetColumns.created,
                   datasetColumns.ordering,
                   datasetColumns.jsonOrdering,
                   datasetColumns.typeId
            FROM   datasetColumns, datasets
            WHERE  datasets.userId = ${auth.id}
               AND datasets.id = datasetColumns.datasetId
               AND ((datasets.id = ${datasetId || ''}) OR ${!datasetId})
            ORDER BY datasetColumns.ordering
        `;

        return Result.collect(
            columns.map(column => {
                const type = typesRes.val[column.typeId];
                if (!type) return Result.err('Invalid column type found');

                const decryptedName = decrypt(column.name, auth.key);
                if (!decryptedName.ok) return decryptedName.cast();

                return Result.ok({
                    id: column.id,
                    datasetId: column.datasetId,
                    created: column.created,
                    name: decryptedName.val,
                    ordering: column.ordering,
                    jsonOrdering: column.ordering,
                    type
                });
            })
        );
    }

    export async function getDatasetFromPresetId(
        auth: Auth,
        presetId: PresetId
    ): Promise<Result<Dataset | null>> {
        return await query<
            { id: string; name: string; created: TimestampSecs; presetId: PresetId | null }[]
        >`
            SELECT id, name, created, presetId
            FROM datasets
            WHERE userId = ${auth.id}
                AND presetId = ${presetId}
        `.then(rows => {
            if (rows.length === 0) return Result.ok(null);
            const [{ id, name, created, presetId }] = rows;
            const nameDecrypted = decrypt(name, auth.key);
            if (!nameDecrypted.ok) return nameDecrypted.cast();
            return Result.ok({
                id,
                name: nameDecrypted.val,
                created,
                preset: presetId ? datasetPresets[presetId] : null
            });
        });
    }

    export async function getDataset(auth: Auth, datasetId: string): Promise<Result<Dataset>> {
        const rows = await query<
            { id: string; name: string; created: TimestampSecs; presetId: PresetId | null }[]
        >`
            SELECT id, name, created, presetId
            FROM datasets
            WHERE userId = ${auth.id}
                AND id = ${datasetId}
        `;
        if (rows.length === 0) return Result.err('Dataset not found');
        const [{ id, name, created, presetId }] = rows;
        const nameDecrypted = decrypt(name, auth.key);
        if (!nameDecrypted.ok) return nameDecrypted.cast();

        return Result.ok({
            id,
            name: nameDecrypted.val,
            created,
            preset: presetId ? datasetPresets[presetId] : null
        });
    }

    export async function getDatasetMetadata(
        auth: Auth,
        datasetId: string
    ): Promise<Result<DatasetMetadata>> {
        const dataset = await getDataset(auth, datasetId);
        if (!dataset.ok) return dataset.cast();

        let columns = [];

        if (dataset.val.preset) {
            columns = datasetPresets[dataset.val.preset.id as PresetId].columns;
        } else {
            const allCols = await getUserDefinedColumns(auth, datasetId);
            if (!allCols.ok) return allCols.cast();

            columns = allCols.val.filter(c => c.datasetId === datasetId);
        }

        const [{ rowCount }] = await query<{ rowCount: number }[]>`
            SELECT COUNT(*) AS rowCount
            FROM datasetRows
            WHERE datasetId = ${datasetId}
            AND userId = ${auth.id}
        `;

        return Result.ok({
            ...dataset.val,
            columns,
            rowCount
        });
    }

    export async function allMetaData(auth: Auth): Promise<Result<DatasetMetadata[]>> {
        const metadatas = [] as DatasetMetadata[];

        const datasets = await query<
            {
                id: string;
                name: string;
                created: number;
                presetId: string | null;
                rowCount: number;
            }[]
        >`
            SELECT
                datasets.id,
                datasets.name,
                datasets.created,
                datasets.presetId,
                -- I think faster than using a join,
                -- 1.3ms vs 2.2ms so not a huge difference
                (
                    SELECT COUNT(*) AS rowCount
                    FROM datasetRows
                    WHERE datasetId = datasets.id
                        AND userId = ${auth.id}
                ) as rowCount
            FROM datasets
            WHERE datasets.userId = ${auth.id}
            ORDER BY created DESC
        `;

        const usersColumnsRes = await getUserDefinedColumns(auth);
        if (!usersColumnsRes.ok) return usersColumnsRes.cast();

        for (const dataset of datasets) {
            const decryptedName = decrypt(dataset.name, auth.key);
            if (!decryptedName.ok) return decryptedName.cast();
            let preset: DatasetPreset | null = null;
            if (dataset.presetId) {
                preset = datasetPresets[dataset.presetId as PresetId];
                if (!preset) {
                    await logger.error('Invalid preset ID', { dataset });
                    return Result.err('Invalid preset ID');
                }
            }

            let columns: DatasetColumn<unknown>[];
            if (preset) {
                columns = preset.columns;
            } else {
                columns = usersColumnsRes.val
                    .filter(c => c.datasetId === dataset.id)
                    .sort((a, b) => b.ordering - a.ordering);
            }

            metadatas.push({
                id: dataset.id,
                name: decryptedName.val,
                created: dataset.created,
                columns,
                preset,
                rowCount: dataset.rowCount
            });
        }

        return Result.ok(metadatas);
    }

    export async function getDatasetRows(
        auth: Auth,
        settings: SettingsConfig,
        datasetId: string,
        filter: DatasetDataFilter
    ): Promise<Result<DatasetData>> {
        const datasetRes = await query<
            { id: string; name: string; created: TimestampSecs; presetId: PresetId | null }[]
        >`
            SELECT id, name, created, presetId
            FROM datasets
            WHERE userId = ${auth.id}
                AND id = ${datasetId}
        `;
        if (datasetRes.length !== 1) {
            return Result.err('Dataset not found');
        }
        const [dataset] = datasetRes;

        let preset: DatasetPreset | null = null;
        if (dataset.presetId) {
            preset = datasetPresets[dataset.presetId];
            if (!preset) {
                await logger.error('Invalid preset ID', { dataset });
                return Result.err('Invalid preset ID');
            }
        }

        let thirdPartyProvider: ThirdPartyDatasetProvider | null = null;
        if (dataset.presetId) {
            thirdPartyProvider = thirdPartyDatasetProviders[dataset.presetId];
        }

        if (thirdPartyProvider) {
            return await thirdPartyProvider.fetchDataset(auth, settings, filter);
        }

        const rows = await query<
            {
                id: number;
                created: number;
                timestamp: number;
                timestampTzOffset: number;
                rowJson: string;
            }[]
        >`
            SELECT
                id,
                created,
                timestamp,
                timestampTzOffset,
                rowJson
            FROM datasetRows
            WHERE datasetId = ${datasetId}
            ORDER BY timestamp DESC
        `;

        return Result.collect(
            rows.map(row => {
                let elements: unknown[];
                const decryptedJson = decrypt(row.rowJson, auth.key);
                if (!decryptedJson.ok) return Result.err('Invalid data point');

                try {
                    const parsedRowData = JSON.parse(decryptedJson.val);
                    if (!Array.isArray(parsedRowData)) {
                        return Result.err('Invalid row JSON');
                    }
                    elements = parsedRowData;
                } catch (_) {
                    return Result.err('Invalid row JSON');
                }
                return Result.ok({
                    id: row.id,
                    created: row.created,
                    timestamp: row.timestamp,
                    timestampTzOffset: row.timestampTzOffset,
                    elements
                });
            })
        );
    }

    async function canCreateWithName(
        auth: Auth,
        namePlaintext: string,
        presetId: string | null
    ): Promise<string | true> {
        if (namePlaintext.length < 1) {
            return 'Name must be at least 1 character long';
        }
        if (namePlaintext.length > 100) {
            return 'Name must be at most 100 characters long';
        }

        const numDatasets = await query<{ count: number }[]>`
            SELECT COUNT(*) AS count
            FROM datasets
            WHERE datasets.userId = ${auth.id}
        `;
        if (numDatasets[0].count >= LIMITS.dataset.maxCount) {
            return `Maximum number of datasets (${LIMITS.dataset.maxCount}) reached`;
        }

        const encryptedName = encrypt(namePlaintext, auth.key);

        const existingWithName = await query<{ name: string }[]>`
            SELECT name
            FROM datasets
            WHERE name = ${encryptedName}
              AND datasets.userId = ${auth.id}
        `;
        if (existingWithName.length > 0) {
            return 'Dataset with that name already exists';
        }

        if (typeof presetId === 'string') {
            if (!(presetId in datasetPresets)) {
                await logger.error('Invalid preset ID', { presetId });
                return 'Invalid preset ID';
            }
            const existingWithPreset = await query<{ name: string }[]>`
                SELECT name
                FROM datasets
                WHERE presetId = ${presetId}
                  AND datasets.userId = ${auth.id}
            `;
            if (existingWithPreset.length > 0) {
                const presetName = datasetPresets[presetId as PresetId].defaultName;
                const fromPresetName = existingWithPreset[0].name;
                return `Dataset already created from preset '${presetName}': '${fromPresetName}`;
            }
        }

        return true;
    }

    export async function create(
        auth: Auth,
        name: string,
        created: TimestampSecs,
        presetId: string | null
    ): Promise<Result<Dataset>> {
        const id = await UId.generate();

        const canCreate = await canCreateWithName(auth, name, presetId);
        if (canCreate !== true) return Result.err(canCreate);

        await query`
            INSERT INTO datasets (id, userId, name, created, presetId)
            VALUES (${id}, ${auth.id}, ${encrypt(name, auth.key)}, ${created}, ${presetId})
        `;

        return Result.ok({
            id,
            name,
            created,
            preset: presetId ? datasetPresets[presetId as PresetId] : null
        });
    }

    export async function validateTypesOfRows(
        auth: Auth,
        datasetId: string,
        rowElements: unknown[][]
    ): Promise<Result<null>> {
        if (rowElements.length < 1) return Result.ok(null);

        const datasets = await query<{ presetId: string | null }[]>`
            SELECT presetId
            FROM datasets
            WHERE id = ${datasetId}
            AND userId = ${auth.id}
        `;
        if (datasets.length !== 1) {
            if (datasets.length !== 0) {
                void logger.error('Multiple datasets found with same ID', { datasetId });
            }
            return Result.err('Dataset not found');
        }
        const [{ presetId }] = datasets;
        let columns: DatasetColumn<unknown>[];
        if (presetId) {
            const preset = datasetPresets[presetId as PresetId];
            // TODO: check if is external or not
            //       if external, cannot add columns
            columns = preset.columns;
        } else {
            const allColumnsRes = await getUserDefinedColumns(auth);
            if (!allColumnsRes.ok) return allColumnsRes.cast();
            // TODO: order columns the same way as row elements are ordered
            columns = allColumnsRes.val
                .filter(c => c.datasetId === datasetId)
                .sort((a, b) => a.jsonOrdering - b.jsonOrdering);
        }

        for (const row of rowElements) {
            if (columns.length !== row.length) {
                return Result.err(
                    `Invalid number of values in row: expected ${columns.length} but found ${row.length}`
                );
            }

            for (let i = 0; i < columns.length; i++) {
                const column = columns[i];
                const value = row[i];
                if (!column.type.validate(value)) {
                    return Result.err(`Invalid value in column '${i + 1}'`);
                }
            }
        }

        return Result.ok(null);
    }

    export async function appendRows(
        auth: Auth,
        datasetId: string,
        rows: {
            elements: unknown[];
            timestamp?: TimestampSecs;
            timestampTzOffset?: Hours;
            created?: TimestampSecs;
        }[],
        onSameTimestamp: 'override' | 'append' | 'skip' | 'error'
    ): Promise<Result<number[]>> {
        if (!['override', 'append', 'skip', 'error'].includes(onSameTimestamp)) {
            return Result.err('Invalid onSameTimestamp value');
        }
        if (rows.length < 1) return Result.ok([]);

        if (rows.length > LIMITS.dataset.maxAppendCount) {
            return Result.err(
                `Cannot append more than ${LIMITS.dataset.maxAppendCount} rows at once`
            );
        }

        const validateRowTypes = await validateTypesOfRows(
            auth,
            datasetId,
            rows.map(r => r.elements)
        );
        if (!validateRowTypes.ok) return validateRowTypes.cast();

        const maxRowId = await query<{ id: number }[]>`
            SELECT MAX(datasetRows.id) AS id
            FROM datasetRows, datasets
            WHERE datasetRows.datasetId = ${datasetId} 
                AND datasets.userId = ${auth.id}
                AND datasets.id = datasetRows.datasetId
        `;

        let nextRowId = maxRowId.length > 0 ? maxRowId[0].id : -1;
        const firstRowId = nextRowId + 1;
        for (const row of rows) {
            nextRowId++;

            const rowId = nextRowId;
            const rowTimestamp = row.timestamp ?? nowUtc();
            const rowCreated = row.created ?? nowUtc();
            const rowTimestampTzOffset = row.timestampTzOffset ?? 0;
            const rowJson = JSON.stringify(row.elements);

            if (onSameTimestamp !== 'append') {
                const [{ count }] = await query<{ count: number }[]>`
                    SELECT COUNT(*) AS count
                    FROM datasetRows
                    WHERE datasetId = ${datasetId}
                        AND userId = ${auth.id}
                        AND timestamp = ${rowTimestamp}
                `;
                if (count > 0) {
                    if (onSameTimestamp === 'error') {
                        return Result.err(
                            `Row with timestamp ${rowTimestamp} already exists in dataset`
                        );
                    } else if (onSameTimestamp === 'skip') {
                        continue;
                    } else if (onSameTimestamp === 'override') {
                        await query`
                            DELETE FROM datasetRows
                            WHERE datasetId = ${datasetId}
                                AND userId = ${auth.id}
                                AND timestamp = ${rowTimestamp}
                        `;
                    }
                }
            }

            await query`
                INSERT INTO datasetRows (id, userId, datasetId, created, timestamp, timestampTzOffset, rowJson)
                VALUES (
                    ${rowId},
                    ${auth.id},
                    ${datasetId},
                    ${rowCreated},
                    ${rowTimestamp},
                    ${rowTimestampTzOffset},
                    ${encrypt(rowJson, auth.key)}
                )
            `;
        }

        return Result.ok(range(rows.length, firstRowId));
    }

    export async function updateDatasetColumnsEncryptedFields(
        userId: string,
        oldDecrypt: (a: string) => Result<string>,
        newEncrypt: (a: string) => string
    ): Promise<Result<null[], string>> {
        const datasetColumns = await query<
            {
                id: string;
                name: string;
            }[]
        >`
            SELECT id, name
            FROM datasetColumns
            WHERE userId = ${userId}
        `;

        return await Result.collectAsync(
            datasetColumns.map(async (col): Promise<Result<null>> => {
                const nameRes = oldDecrypt(col.name);
                if (!nameRes.ok) return nameRes.cast();

                await query`
                    UPDATE datasetColumns
                    SET name = ${newEncrypt(nameRes.val)}
                    WHERE id = ${col.id}
                      AND userId = ${userId}
                `;
                return Result.ok(null);
            })
        );
    }

    export async function updateDatasetEncryptedFields(
        userId: string,
        oldDecrypt: (a: string) => Result<string>,
        newEncrypt: (a: string) => string
    ): Promise<Result<null[], string>> {
        const datasetColumns = await query<
            {
                id: string;
                name: string;
            }[]
        >`
            SELECT id, name
            FROM datasets
            WHERE userId = ${userId}
        `;

        return await Result.collectAsync(
            datasetColumns.map(async (col): Promise<Result<null>> => {
                const nameRes = oldDecrypt(col.name);
                if (!nameRes.ok) return nameRes.cast();

                await query`
                    UPDATE datasets
                    SET name = ${newEncrypt(nameRes.val)}
                    WHERE id = ${col.id}
                      AND userId = ${userId}
                `;
                return Result.ok(null);
            })
        );
    }

    export async function updateName(
        auth: Auth,
        datasetId: string,
        name: string
    ): Promise<Result<null>> {
        const canCreate = await canCreateWithName(auth, name, null);
        if (canCreate !== true) return Result.err(canCreate);

        await query`
            UPDATE datasets
            SET name = ${encrypt(name, auth.key)}
            WHERE id = ${datasetId}
              AND userId = ${auth.id}
        `;

        return Result.ok(null);
    }

    export async function updateRows(
        auth: Auth,
        datasetId: string,
        rows: (
            | {
                  id: number;
                  elements: unknown[];
                  timestamp: TimestampSecs;
                  timestampTzOffset: Hours;
                  created: TimestampSecs;
              }
            | { id: number; shouldDelete: boolean }
        )[]
    ): Promise<Result<null>> {
        rows = [...rows].sort((a, b) => a.id - b.id);

        const validateRowTypes = await validateTypesOfRows(
            auth,
            datasetId,
            rows
                .filter(
                    (
                        r
                    ): r is {
                        id: number;
                        elements: unknown[];
                        timestamp: TimestampSecs;
                        timestampTzOffset: Hours;
                        created: TimestampSecs;
                    } => !('shouldDelete' in r)
                )
                .map(r => r.elements)
        );
        if (!validateRowTypes.ok) return validateRowTypes.cast();

        for (const row of rows) {
            if ('shouldDelete' in row) {
                if (row.shouldDelete) {
                    await query`
                        DELETE FROM datasetRows
                        WHERE userId = ${auth.id}
                            AND datasetId = ${datasetId}
                            AND id = ${row.id}
                    `;
                }
                continue;
            }
            const updatedRowJson = encrypt(JSON.stringify(row.elements), auth.key);
            await query`
                UPDATE datasetRows
                SET rowJson = ${updatedRowJson}
                WHERE userId = ${auth.id}
                    AND datasetId = ${datasetId}
                    AND id = ${row.id}
            `;
        }
        return Result.ok(null);
    }

    export async function deleteDataset(auth: Auth, datasetId: string): Promise<void> {
        await query`
            DELETE FROM datasets
            WHERE id = ${datasetId}
              AND userId = ${auth.id};

            DELETE FROM datasetColumns
            WHERE datasetId = ${datasetId}
                AND userId = ${auth.id};

            DELETE FROM datasetRows
            WHERE datasetId = ${datasetId}
                AND userId = ${auth.id};
        `;
    }

    export async function existsWithId(auth: Auth, datasetId: string): Promise<boolean> {
        const datasets = await query<{ id: string }[]>`
            SELECT id
            FROM datasets
            WHERE id = ${datasetId}
                AND userId = ${auth.id}
        `;
        return datasets.length > 0;
    }

    export async function addColumn(
        auth: Auth,
        datasetId: string,
        name: string,
        type: DatasetColumnType<unknown>
    ): Promise<Result<DatasetColumn<unknown>>> {
        const id = await UId.generate();
        const encryptedName = encrypt(name, auth.key);
        const created = nowUtc();

        const dataset = await getDataset(auth, datasetId);
        if (!dataset.ok) return dataset.cast();
        if (dataset.val.preset) return Result.err('Cannot add columns to preset datasets');

        const [{ ordering }] = await query<{ ordering: number }[]>`
            SELECT IFNULL(MAX(ordering) + 1, 0) as ordering
            FROM datasetColumns
            WHERE datasetId = ${datasetId}
                AND userId = ${auth.id}
        `;
        const [{ jsonOrdering }] = await query<{ jsonOrdering: number }[]>`
            SELECT IFNULL(MAX(jsonOrdering) + 1, 0) as jsonOrdering
            FROM datasetColumns
            WHERE datasetId = ${datasetId}
                AND userId = ${auth.id}
        `;

        await query`
            INSERT INTO datasetColumns (
                id, userId, datasetId, ordering, jsonOrdering, name, typeId, created
            )
            VALUES (
                ${id}, ${auth.id}, ${datasetId}, ${ordering}, ${jsonOrdering}, ${encryptedName}, ${type.id}, ${created}
            )
        `;

        // TODO scale this better
        const rows = await query<{ id: number; rowJson: string }[]>`
            SELECT id, rowJson
            FROM datasetRows
            WHERE datasetId = ${datasetId}
            AND userId = ${auth.id}
        `;

        for (const row of rows) {
            const decryptedJson = decrypt(row.rowJson, auth.key);
            if (!decryptedJson.ok) return decryptedJson.cast();

            const parsedRowData = JSON.parse(decryptedJson.val);
            if (!Array.isArray(parsedRowData)) {
                return Result.err('Invalid row JSON');
            }

            const updatedRowData = [...parsedRowData, type.defaultValue];
            const updatedRowJson = encrypt(JSON.stringify(updatedRowData), auth.key);

            await query`
                UPDATE datasetRows
                SET rowJson = ${updatedRowJson}
                WHERE id = ${row.id}
            `;
        }

        return Result.ok({
            id,
            datasetId,
            created,
            ordering,
            jsonOrdering,
            name,
            type
        });
    }

    export async function updateColumnType(
        auth: Auth,
        datasetId: string,
        columnId: string,
        type: DatasetColumnType<unknown>
    ): Promise<Result<null>> {
        const dataset = await getDataset(auth, datasetId);
        if (!dataset.ok) return dataset.cast();
        if (dataset.val.preset) return Result.err('Cannot update column types in preset datasets');

        const cols = await getUserDefinedColumns(auth, datasetId);
        if (!cols.ok) return cols.cast();
        const col = cols.val.find(c => c.id === columnId);
        if (!col) return Result.err('Column not found');

        // short circuit on same type
        if (col.type.id === type.id) return Result.ok(null);

        await query`
            UPDATE datasetColumns
            SET typeId = ${type.id}
            WHERE id = ${columnId}
              AND datasetId = ${datasetId}
              AND userId = ${auth.id}
        `;

        // TODO scale this better
        const rows = await query<{ id: number; rowJson: string }[]>`
            SELECT id, rowJson
            FROM datasetRows
            WHERE datasetId = ${datasetId}
            AND userId = ${auth.id}
        `;

        for (const row of rows) {
            const decryptedJson = decrypt(row.rowJson, auth.key);
            if (!decryptedJson.ok) return decryptedJson.cast();

            const parsedRowData = JSON.parse(decryptedJson.val);
            if (!Array.isArray(parsedRowData)) {
                return Result.err('Invalid row JSON');
            }

            const updatedRowData = [...parsedRowData];
            updatedRowData[col.jsonOrdering] = type.castTo(updatedRowData[col.jsonOrdering]);

            const updatedRowJson = encrypt(JSON.stringify(updatedRowData), auth.key);

            await query`
                UPDATE datasetRows
                SET rowJson = ${updatedRowJson}
                WHERE id = ${row.id}
            `;
        }

        return Result.ok();
    }

    export async function updateColumnName(
        auth: Auth,
        datasetId: string,
        columnId: string,
        name: string
    ): Promise<Result<null>> {
        const dataset = await getDataset(auth, datasetId);
        if (!dataset.ok) return dataset.cast();
        if (dataset.val.preset) return Result.err('Cannot update column names in preset datasets');

        const cols = await getUserDefinedColumns(auth, datasetId);
        if (!cols.ok) return cols.cast();
        const col = cols.val.find(c => c.id === columnId);
        if (!col) return Result.err('Column not found');

        const encryptedName = encrypt(name, auth.key);
        await query`
            UPDATE datasetColumns
            SET name = ${encryptedName}
            WHERE id = ${columnId}
              AND datasetId = ${datasetId}
              AND userId = ${auth.id}
        `;

        return Result.ok(null);
    }
}

export const Dataset = {
    ..._Dataset,
    ...DatasetServer
};
export type Dataset = _Dataset;
export type { DatasetColumn, DatasetColumnType, DatasetData, DatasetMetadata } from './dataset';
