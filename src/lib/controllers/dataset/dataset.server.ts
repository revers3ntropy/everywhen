import { LIMITS } from '$lib/constants';
import type { DatasetPreset, PresetId } from '$lib/controllers/dataset/presets';
import { datasetPresets } from '$lib/controllers/dataset/presets';
import { thirdPartyDatasetProviders } from '$lib/controllers/dataset/thirdPartyDatasets.server';
import type { ThirdPartyDatasetProvider } from '$lib/controllers/dataset/thirdPartyDatasets.server';
import type { SettingsConfig } from '$lib/controllers/settings/settings';
import { errorLogger } from '$lib/utils/log.server';
import { query } from '$lib/db/mysql.server';
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
                const type = types[column.typeId];
                if (!type) return Result.err('Invalid column type found');

                const { val: name, err: decryptNameErr } = decrypt(column.name, auth.key);
                if (decryptNameErr) return Result.err(decryptNameErr);

                return Result.ok({
                    id: column.id,
                    datasetId: column.datasetId,
                    created: column.created,
                    name,
                    type
                });
            })
        );
    }

    export async function allMetaData(auth: Auth): Promise<Result<DatasetMetadata[]>> {
        const metadatas = [] as DatasetMetadata[];

        const datasets = await query<
            { id: string; name: string; created: TimestampSecs; presetId: PresetId | null }[]
        >`
            SELECT id, name, created, presetId
            FROM datasets
            WHERE userId = ${auth.id}
        `;

        const { err: columnsRes, val: usersColumns } = await allUserDefinedColumns(auth);
        if (columnsRes) return Result.err(columnsRes);

        for (const dataset of datasets) {
            const { val: decryptedName, err: decryptedNameErr } = decrypt(dataset.name, auth.key);
            if (decryptedNameErr) return Result.err(decryptedNameErr);
            let preset: DatasetPreset | null = null;
            if (dataset.presetId) {
                preset = datasetPresets[dataset.presetId];
                if (!preset) {
                    await errorLogger.error('Invalid preset ID', { dataset });
                    return Result.err('Invalid preset ID');
                }
            }

            let columns: DatasetColumn<unknown>[];
            if (preset) {
                columns = preset.columns;
            } else {
                columns = usersColumns.filter(c => c.datasetId === dataset.id);
            }

            metadatas.push({
                id: dataset.id,
                name: decryptedName,
                created: dataset.created,
                columns,
                preset
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
                await errorLogger.error('Invalid preset ID', { dataset });
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
                try {
                    const parsedRowData = JSON.parse(row.rowJson);
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
        presetId: PresetId | null
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

        if (presetId) {
            if (!(presetId in datasetPresets)) {
                await errorLogger.error('Invalid preset ID', { presetId });
                return 'Invalid preset ID';
            }
            const existingWithPreset = await query<{ name: string }[]>`
                SELECT name
                FROM datasets
                WHERE presetId = ${presetId}
                  AND datasets.userId = ${auth.id}
            `;
            if (existingWithPreset.length > 0) {
                const presetName = datasetPresets[presetId].defaultName;
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
        columns: { name: string; type: string }[]
    ): Promise<Result<Dataset>> {
        const id = await UId.Server.generate();
        const presetId = null;

        const canCreate = await canCreateWithName(auth, name, presetId);
        if (canCreate !== true) return Result.err(canCreate);

        await query`
            INSERT INTO datasets (id, userId, name, created, presetId)
            VALUES (${id}, ${auth.id}, ${encrypt(name, auth.key)}, ${created}, ${presetId})
        `;

        const { val: types, err: getTypesErr } = allTypes();
        if (getTypesErr) return Result.err(getTypesErr);

        for (let i = 0; i < columns.length; i++) {
            const column = columns[i];
            const type = types[column.type];
            if (!type) return Result.err('Invalid column type');

            const nameEncrypted = encrypt(column.name, auth.key);

            await query`
                INSERT INTO datasetColumns (id, userId, datasetId, name, created, typeId)
                VALUES (${i}, ${auth.id}, ${id}, ${nameEncrypted}, ${created}, ${type.id})
            `;
        }

        return Result.ok({
            id,
            name,
            created,
            preset: presetId ? datasetPresets[presetId] : null
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
        const { val: columns, err: getColumnsErr } = await allUserDefinedColumns(auth);
        if (getColumnsErr) return Result.err(getColumnsErr);

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
                    return Result.err(`Invalid value for '${column.name}'`);
                }
            }

            const rowId = nextRowId;
            nextRowId++;

            const rowTimestamp = row.timestamp ?? nowUtc();
            const rowTimestampTzOffset = row.timestampTzOffset ?? 0;
            const rowJson = JSON.stringify(row.elements);

            await query`
                INSERT INTO datasetRows (id, userId, datasetId, created, timestamp, timestampTzOffset, rowJson)
                VALUES (
                    ${rowId},
                    ${auth.id},
                    ${datasetId},
                    ${nowUtc()},
                    ${rowTimestamp},
                    ${rowTimestampTzOffset},
                    ${rowJson}
                )
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
export type { DatasetColumn, DatasetColumnType, DatasetData, DatasetMetadata } from './dataset';
