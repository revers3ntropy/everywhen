<script lang="ts">
    import { fmtTimestampForInput } from '$lib/utils/time.js';
    import Delete from 'svelte-material-icons/DeleteOutline.svelte';
    import Pencil from 'svelte-material-icons/Pencil.svelte';
    import * as Popover from '$lib/components/ui/popover';
    import { notify } from '$lib/components/notifications/notifications';
    import { dispatch } from '$lib/dataChangeEvents';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { currentTzOffset, nowUtc } from '$lib/utils/time';
    import {
        Dataset,
        type DatasetMetadata,
        type DatasetRow
    } from '$lib/controllers/dataset/dataset';
    import { builtInTypes } from '$lib/controllers/dataset/columnTypes';
    import EditDatasetColumnDialog from './EditDatasetColumnDialog.svelte';

    export let dataset: DatasetMetadata;
    export let rows: DatasetRow[];

    async function addColumn() {
        const newColumn = notify.onErr(
            await api.post(apiPath(`/datasets/?/columns`, dataset.id), {
                name: 'New Column',
                type: 'number'
            })
        );
        await dispatch.create('datasetCol', newColumn);
    }

    async function addRow() {
        const row = {
            elements: columnsOrderedByJsonOrder.map(c => c.type.defaultValue),
            created: nowUtc(),
            timestamp: nowUtc(),
            timestampTzOffset: currentTzOffset()
        };

        const { ids } = notify.onErr(
            await api.post(apiPath(`/datasets/?`, dataset.id), {
                rows: [row]
            })
        );
        if (ids.length !== 1) {
            notify.error('Failed to add row');
            return;
        }

        await dispatch.create('datasetRow', {
            datasetId: dataset.id,
            row: { ...row, id: ids[0] }
        });
    }

    async function editDatasetRow(row: DatasetRow, jsonIdx: number, newValue: unknown) {
        const newRow = {
            ...row,
            elements: row.elements.map((val, i) => (i === jsonIdx ? newValue : val))
        };
        notify.onErr(
            await api.put(apiPath(`/datasets/?`, dataset.id), {
                rows: [newRow]
            })
        );
        await dispatch.update(
            'datasetRow',
            { datasetId: dataset.id, row },
            {
                datasetId: dataset.id,
                row: newRow
            }
        );
    }

    async function editDatasetRowTimestamp(row: DatasetRow, newTimestamp: number) {
        const newRow = {
            ...row,
            timestampTzOffset: currentTzOffset(),
            timestamp: newTimestamp
        };
        notify.onErr(
            await api.put(apiPath(`/datasets/?`, dataset.id), {
                rows: [newRow]
            })
        );
        await dispatch.update(
            'datasetRow',
            { datasetId: dataset.id, row },
            {
                datasetId: dataset.id,
                row: newRow
            }
        );
    }

    async function deleteDatasetRow(row: DatasetRow) {
        if (!confirm('Are you sure you want to delete this row?')) return;
        notify.onErr(
            await api.put(apiPath(`/datasets/?`, dataset.id), {
                rows: [{ id: row.id, shouldDelete: true }]
            })
        );
        await dispatch.delete('datasetRow', { datasetId: dataset.id, rowId: row.id });
    }

    $: columnsOrderedByJsonOrder = Dataset.sortColumnsForJson(dataset.columns);
</script>

<div class="pt-8">
    <table class="w-full block border-borderColor border overflow-x-auto">
        <tr>
            <th class="p-2 border-r border-borderColor"> Timestamp </th>
            {#each Dataset.sortColumnsForDisplay(dataset.columns) as column}
                <th
                    class="border-r border-borderColor min-w-[150px] bg-vLightAccent"
                    class:hover:bg-lightAccent={!dataset.preset}
                >
                    {#if !dataset.preset}
                        <Popover.Root>
                            <Popover.Trigger>
                                <span class="group p-2 w-full">
                                    {column.name}
                                    <span class="invisible group-hover:visible">
                                        <Pencil size={18} />
                                    </span>
                                </span>
                            </Popover.Trigger>
                            <Popover.Content>
                                <EditDatasetColumnDialog datasetId={dataset.id} {column} />
                            </Popover.Content>
                        </Popover.Root>
                    {:else}
                        {column.name}
                    {/if}
                </th>
            {/each}
            <th>
                {#if !dataset.preset}
                    <button
                        class="border-0 border-r border-solid border-borderColor h-full px-3 py-2.5 bg-vLightAccent hover:bg-lightAccent text-light hover:text-textColor"
                        on:click={addColumn}
                    >
                        +
                    </button>
                {/if}
            </th>
        </tr>
        <tr class="p-2 border-t border-borderColor">
            <td>
                <button
                    class="p-2 bg-vLightAccent hover:bg-lightAccent text-light hover:text-textColor"
                    on:click={addRow}
                >
                    + Add Row
                </button>
            </td>
        </tr>
        {#if rows && rows.length}
            {#each rows as row}
                <tr class="p-2 border-t border-borderColor">
                    <td class="border-r border-borderColor">
                        <input
                            type="datetime-local"
                            value={fmtTimestampForInput(row.timestamp, row.timestampTzOffset)}
                            class="editable-text px-2 focus:rounded-none"
                            on:change={e => {
                                const date = new Date(e.currentTarget.value);
                                return editDatasetRowTimestamp(row, date.getTime() / 1000);
                            }}
                        />
                    </td>
                    {#each row.elements as element, i}
                        {@const column = columnsOrderedByJsonOrder[i]}
                        {@const colTypeId = column.type.id}

                        <td class="border-r border-borderColor">
                            {#if colTypeId === builtInTypes.number.id || colTypeId === builtInTypes.nullableNumber.id}
                                <input
                                    type="number"
                                    value={element}
                                    class="editable-text px-2 focus:rounded-none"
                                    placeholder={colTypeId === builtInTypes.number.id
                                        ? '0'
                                        : 'null'}
                                    on:change={e => {
                                        const num = parseFloat(e.currentTarget.value);
                                        return editDatasetRow(
                                            row,
                                            column.jsonOrdering,
                                            isNaN(num) ? column.type.defaultValue : num
                                        );
                                    }}
                                />
                            {:else if colTypeId === builtInTypes.boolean.id && typeof element === 'boolean'}
                                <input
                                    type="checkbox"
                                    checked={element}
                                    class="editable-text px-2 focus:rounded-none"
                                    on:change={e =>
                                        editDatasetRow(
                                            row,
                                            column.jsonOrdering,
                                            e.currentTarget.checked
                                        )}
                                />
                            {:else}
                                <input
                                    value={element}
                                    class="editable-text px-2 focus:rounded-none"
                                    on:change={e =>
                                        editDatasetRow(
                                            row,
                                            column.jsonOrdering,
                                            e.currentTarget.value
                                        )}
                                />
                            {/if}
                        </td>
                    {/each}
                    <td>
                        <button
                            on:click={() => deleteDatasetRow(row)}
                            class="block hover:bg-lightAccent h-full px-1 py-2"
                        >
                            <Delete size="25" />
                        </button>
                    </td>
                </tr>
            {/each}
        {:else if rows}
            <tr class="p-2 border-t border-borderColor">
                <td
                    class="p-2 border border-borderColor italic text-light"
                    colspan={dataset.columns.length + 2}
                >
                    No rows
                </td>
            </tr>
        {:else}
            <tr class="p-2 border-t border-borderColor">
                <td
                    class="p-2 border border-borderColor italic text-light"
                    colspan={dataset.columns.length + 2}
                >
                    Loading...
                </td>
            </tr>
        {/if}
    </table>
</div>
