import {
    Dataset,
    type DatasetColumn,
    type DatasetColumnType,
    type DatasetRow,
    type DecryptedDatasetRow
} from '$lib/controllers/dataset/dataset';
import { tryDecryptText, tryEncryptText } from '$lib/utils/encryption.client';
import { notify } from '$lib/components/notifications/notifications';
import { api, apiPath } from '$lib/utils/apiRequest';
import { dispatch } from '$lib/dataChangeEvents';
import { currentTzOffset, nowUtc } from '$lib/utils/time';
import { CSLogger } from '$lib/controllers/logs/logger.client';
import { Result } from '$lib/utils/result';

export function decryptDatasetRows(
    columns: DatasetColumn<unknown>[],
    rows: DatasetRow[]
): DecryptedDatasetRow[] {
    return Dataset.sortRowsElementsForDisplay(
        columns,
        rows.map(row => {
            const rowJsonDecrypted = tryDecryptText(row.rowJson);
            const rowJson = JSON.parse(rowJsonDecrypted) as unknown[];
            const res: DecryptedDatasetRow & { rowJson: unknown } = {
                ...row,
                elements: rowJson
            };
            delete res.rowJson;
            return res;
        })
    );
}

export function encryptDatasetRows(
    columns: DatasetColumn<unknown>[],
    rows: DecryptedDatasetRow[]
): DatasetRow[] {
    const jsonSortedRows = Dataset.sortRowsElementsForJson(columns, rows);
    return jsonSortedRows.map(row => {
        const rowJsonDecrypted = JSON.stringify(row.elements);
        const res: DatasetRow & { elements: unknown } = {
            ...row,
            rowJson: tryEncryptText(rowJsonDecrypted)
        };
        delete res.elements;
        return res;
    });
}

export async function addColumn(
    datasetId: string,
    columns: DatasetColumn<unknown>[],
    rows: DecryptedDatasetRow[]
) {
    const oldRows = encryptDatasetRows(columns, rows);
    const updatedDecryptedRows = rows.map(row => ({
        ...row,
        elements: [...row.elements, 0]
    }));
    const updatedRows = encryptDatasetRows(columns, updatedDecryptedRows);
    const newColumn = notify.onErr(
        await api.post(apiPath(`/datasets/?/columns`, datasetId), {
            name: tryEncryptText('New Column'),
            type: 'number',
            updatedRows
        })
    );
    await dispatch.create('datasetCol', newColumn);
    for (let i = 0; i < rows.length; i++) {
        await dispatch.update(
            'datasetRow',
            { datasetId, row: updatedRows[i] },
            { datasetId, row: oldRows[i] }
        );
    }
}

export async function addRow(datasetId: string, columns: DatasetColumn<unknown>[]) {
    const columnsOrderedByJsonOrder = Dataset.sortColumnsForJson(columns);
    const rows = encryptDatasetRows(columns, [
        {
            id: -1,
            elements: columnsOrderedByJsonOrder.map(c => c.type.defaultValue),
            created: nowUtc(),
            timestamp: nowUtc(),
            timestampTzOffset: currentTzOffset()
        }
    ]);

    const { ids } = notify.onErr(
        await api.post(apiPath(`/datasets/?`, datasetId), {
            rows
        })
    );
    if (ids.length !== 1) {
        void CSLogger.error('got back !=1 row', { ids, datasetId, rows });
        notify.error('Failed to add row');
        return;
    }

    await dispatch.create('datasetRow', {
        datasetId,
        row: { ...rows[0], id: ids[0] }
    });
}

export async function editDatasetRow(
    datasetId: string,
    columns: DatasetColumn<unknown>[],
    rowDecrypted: DecryptedDatasetRow,
    jsonIdx: number,
    newValue: unknown
) {
    const oldRow = encryptDatasetRows(columns, [rowDecrypted])[0];
    const newRowDecrypted = {
        ...rowDecrypted,
        elements: rowDecrypted.elements.map((val, i) => (i === jsonIdx ? newValue : val))
    };
    const rows = encryptDatasetRows(columns, [newRowDecrypted]);
    notify.onErr(
        await api.put(apiPath(`/datasets/?`, datasetId), {
            rows
        })
    );
    await dispatch.update(
        'datasetRow',
        { datasetId, row: rows[0] },
        {
            datasetId,
            row: oldRow
        }
    );
}

export async function editDatasetRowTimestamp(
    datasetId: string,
    columns: DatasetColumn<unknown>[],
    rowDecrypted: DecryptedDatasetRow,
    newTimestamp: number
) {
    const oldRow = encryptDatasetRows(columns, [rowDecrypted])[0];
    const newRowDecrypted = {
        ...rowDecrypted,
        timestamp: newTimestamp,
        timestampTzOffset: currentTzOffset()
    };
    const rows = encryptDatasetRows(columns, [newRowDecrypted]);
    notify.onErr(
        await api.put(apiPath(`/datasets/?`, datasetId), {
            rows
        })
    );
    await dispatch.update(
        'datasetRow',
        { datasetId, row: rows[0] },
        {
            datasetId,
            row: oldRow
        }
    );
}

export async function deleteDatasetRow(datasetId: string, row: DecryptedDatasetRow) {
    if (!confirm('Are you sure you want to delete this row?')) return;
    notify.onErr(
        await api.put(apiPath(`/datasets/?`, datasetId), {
            rows: [{ id: row.id, shouldDelete: true }]
        })
    );
    await dispatch.delete('datasetRow', { datasetId, rowId: row.id });
}

export async function updateDatasetColumn(
    datasetId: string,
    columns: DatasetColumn<unknown>[],
    column: DatasetColumn<unknown>,
    decryptedRows: DecryptedDatasetRow[],
    newColumnType: DatasetColumnType<unknown>,
    newColumnNameDecrypted: string
): Promise<Result<null>> {
    const rows = encryptDatasetRows(columns, decryptedRows);
    let updatedRows: DatasetRow[] | undefined;
    const typeDidChange = newColumnType !== column.type;
    if (typeDidChange) {
        if (!confirm('Are you sure you want to update the type of this row?')) {
            return Result.ok();
        }
        const updatedDecryptedRows = decryptedRows.map(row => {
            const oldElement = row.elements[column.jsonOrdering];
            const newElement = newColumnType.castTo(oldElement);
            const newElements = [...row.elements];
            newElements[column.jsonOrdering] = newElement;
            return { ...row, elements: newElements };
        });
        updatedRows = encryptDatasetRows(columns, updatedDecryptedRows);
    }
    const res = await api.put(apiPath(`/datasets/?/columns/?`, datasetId, column.id), {
        type: typeDidChange ? newColumnType.id : undefined,
        name: tryEncryptText(newColumnNameDecrypted),
        updatedRows
    });
    if (!res.ok) return res.cast();
    await dispatch.update('datasetCol', column, {
        ...column,
        name: tryEncryptText(newColumnNameDecrypted),
        type: newColumnType
    });
    if (updatedRows) {
        for (let i = 0; i < rows.length; i++) {
            await dispatch.update(
                'datasetRow',
                { datasetId, row: updatedRows[i] },
                {
                    datasetId,
                    row: rows[i]
                }
            );
        }
    }
    return Result.ok();
}
