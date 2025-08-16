<script lang="ts">
    import { fmtTimestampForInput } from '$lib/utils/time.js';
    import Delete from 'svelte-material-icons/DeleteOutline.svelte';
    import Pencil from 'svelte-material-icons/Pencil.svelte';
    import * as Popover from '$lib/components/ui/popover';
    import {
        Dataset,
        type DatasetMetadata,
        type DecryptedDatasetRow
    } from '$lib/controllers/dataset/dataset';
    import { builtInTypes } from '$lib/controllers/dataset/columnTypes';
    import EditDatasetColumnDialog from './EditDatasetColumnDialog.svelte';
    import EncryptedText from '$lib/components/ui/EncryptedText.svelte';
    import {
        addRow,
        deleteDatasetRow,
        editDatasetRow,
        editDatasetRowTimestamp,
        addColumn
    } from './datasetActions.client';

    export let dataset: DatasetMetadata;
    export let rows: DecryptedDatasetRow[];

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
                                    <EncryptedText text={column.name} />
                                    <span class="invisible group-hover:visible">
                                        <Pencil size={18} />
                                    </span>
                                </span>
                            </Popover.Trigger>
                            <Popover.Content>
                                <EditDatasetColumnDialog
                                    columns={dataset.columns}
                                    datasetId={dataset.id}
                                    {column}
                                    decryptedRows={rows}
                                />
                            </Popover.Content>
                        </Popover.Root>
                    {:else}
                        <EncryptedText text={column.name} />
                    {/if}
                </th>
            {/each}
            <th>
                {#if !dataset.preset}
                    <button
                        class="border-0 border-r border-solid border-borderColor h-full px-3 py-2.5 bg-vLightAccent hover:bg-lightAccent text-light hover:text-textColor"
                        on:click={() => addColumn(dataset.id, dataset.columns, rows)}
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
                    on:click={() => addRow(dataset.id, dataset.columns)}
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
                                return editDatasetRowTimestamp(
                                    dataset.id,
                                    dataset.columns,
                                    row,
                                    date.getTime() / 1000
                                );
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
                                            dataset.id,
                                            dataset.columns,
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
                                            dataset.id,
                                            dataset.columns,
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
                                            dataset.id,
                                            dataset.columns,
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
                            on:click={() => deleteDatasetRow(dataset.id, row)}
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
