import { LIMITS } from '$lib/constants';
import type { DatasetPreset, PresetId } from '$lib/controllers/dataset/presets';
import { datasetPresets } from '$lib/controllers/dataset/presets';
import { thirdPartyDatasetProviders } from '$lib/controllers/dataset/thirdPartyDatasets.server';
import type { ThirdPartyDatasetProvider } from '$lib/controllers/dataset/thirdPartyDatasets.server';
import type { SettingsConfig } from '$lib/controllers/settings/settings';
import { query } from '$lib/db/mysql.server';
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

    async function allUserDefinedColumns(
        auth: Auth,
        datasetId?: string
    ): Promise<Result<DatasetColumn<unknown>[]>> {
        const typesRes = allTypes();
        if (!typesRes.ok) return typesRes.cast();

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
                const type = typesRes.val[column.typeId];
                if (!type) return Result.err('Invalid column type found');

                const decryptedName = decrypt(column.name, auth.key);
                if (!decryptedName.ok) return decryptedName.cast();

                return Result.ok({
                    id: column.id,
                    datasetId: column.datasetId,
                    created: column.created,
                    name: decryptedName.val,
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

    export async function getDatasetMetadata(
        auth: Auth,
        datasetId: string
    ): Promise<Result<DatasetMetadata | null>> {
        const rows = await query<
            { id: string; name: string; created: TimestampSecs; presetId: PresetId | null }[]
        >`
            SELECT id, name, created, presetId
            FROM datasets
            WHERE userId = ${auth.id}
                AND id = ${datasetId}
        `;
        if (rows.length === 0) return Result.ok(null);
        const [{ id, name, created, presetId }] = rows;
        const nameDecrypted = decrypt(name, auth.key);
        if (!nameDecrypted.ok) return nameDecrypted.cast();

        let columns = [];

        if (presetId) {
            columns = datasetPresets[presetId].columns;
        } else {
            const allCols = await allUserDefinedColumns(auth, datasetId);
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
            id,
            name: nameDecrypted.val,
            created,
            preset: presetId ? datasetPresets[presetId] : null,
            columns,
            rowCount
        });
    }

    export async function hasDatasetWithPresetId(auth: Auth, presetId: PresetId): Promise<boolean> {
        return await query<{ id: string }[]>`
            SELECT id
            FROM datasets
            WHERE userId = ${auth.id}
                AND presetId = ${presetId}
        `.then(rows => rows.length > 0);
    }

    export async function allMetaData(auth: Auth): Promise<Result<DatasetMetadata[]>> {
        const metadatas = [] as DatasetMetadata[];

        const datasets = await query<
            { id: string; name: string; created: number; presetId: string | null }[]
        >`
            SELECT id, name, created, presetId
            FROM datasets
            WHERE userId = ${auth.id}
        `;

        const usersColumnsRes = await allUserDefinedColumns(auth);
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
                columns = usersColumnsRes.val.filter(c => c.datasetId === dataset.id);
            }

            // TODO remove and add as cached column on Dataset table
            const [{ rowCount }] = await query<{ rowCount: number }[]>`
                SELECT COUNT(*) AS rowCount
                FROM datasetRows
                WHERE datasetId = ${dataset.id}
                AND userId = ${auth.id}
            `;

            metadatas.push({
                id: dataset.id,
                name: decryptedName.val,
                created: dataset.created,
                columns,
                preset,
                rowCount
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
                } catch (e) {
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
    ): Promise<Result<null>> {
        if (!['override', 'append', 'skip', 'error'].includes(onSameTimestamp)) {
            return Result.err('Invalid onSameTimestamp value');
        }
        if (rows.length < 1) return Result.ok(null);

        const allColumnsRes = await allUserDefinedColumns(auth);
        if (!allColumnsRes.ok) return allColumnsRes.cast();

        const maxRowId = await query<{ id: number }[]>`
            SELECT MAX(datasetRows.id) AS id
            FROM datasetRows, datasets
            WHERE datasetRows.datasetId = ${datasetId} 
                AND datasets.userId = ${auth.id}
                AND datasets.id = datasetRows.datasetId
        `;

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
            columns = allColumnsRes.val.filter(c => c.datasetId === datasetId);
        }

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
                    return Result.err(`Invalid value for '${column.name}'`);
                }
            }

            const rowId = nextRowId;
            nextRowId++;

            const rowTimestamp = row.timestamp ?? nowUtc();
            const rowCreated = row.created ?? nowUtc();
            const rowTimestampTzOffset = row.timestampTzOffset ?? 0;
            const rowJson = JSON.stringify(row.elements);

            if (onSameTimestamp !== 'append') {
                const [{ count }] = await query<{ count: number }[]>`
                    SELECT COUNT(*) AS count
                    FROM datasetRows
                    WHERE datasetId = ${datasetId}
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

        return Result.ok(null);
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
}

export const Dataset = {
    ..._Dataset,
    ...DatasetServer
};
export type Dataset = _Dataset;
export type { DatasetColumn, DatasetColumnType, DatasetData, DatasetMetadata } from './dataset';
