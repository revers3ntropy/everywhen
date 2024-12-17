<script lang="ts">
    import { builtInTypes } from '$lib/controllers/dataset/columnTypes';
    import { dispatch, listen } from '$lib/dataChangeEvents';
    import { showPopup } from '$lib/utils/popups';
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { notify } from '$lib/components/notifications/notifications';
    import { Dataset, type DatasetRow } from '$lib/controllers/dataset/dataset';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { currentTzOffset, nowUtc } from '$lib/utils/time';
    import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
    import TuneVariant from 'svelte-material-icons/TuneVariant.svelte';
    import type { PageData } from './$types';
    import DatasetChart from './DatasetChart.svelte';
    import Pencil from 'svelte-material-icons/Pencil.svelte';
    import EditDatasetColumnDialog from './EditDatasetColumnDialog.svelte';

    export let data: PageData;

    let nameInp: HTMLInputElement;
    let rows: DatasetRow[];

    async function updateName() {
        data.dataset.name = nameInp.value;
        await api.put(apiPath(`/datasets/?`, data.dataset.id), { name: data.dataset.name });
    }

    async function deleteDataset() {
        if (!confirm('Are you sure you want to delete this dataset?')) return;
        notify.onErr(await api.delete(apiPath(`/datasets/?`, data.dataset.id)));
        await dispatch.delete('dataset', data.dataset.id);
        await goto('/datasets');
    }

    async function addColumn() {
        const newColumn = notify.onErr(
            await api.post(apiPath(`/datasets/?/columns`, data.dataset.id), {
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

        notify.onErr(
            await api.post(apiPath(`/datasets/?`, data.dataset.id), {
                rows: [row]
            })
        );
        data.dataset.rowCount++;
    }

    async function editDatasetRow(row: DatasetRow, jsonIdx: number, newValue: unknown) {
        row.elements[jsonIdx] = newValue;
        notify.onErr(
            await api.put(apiPath(`/datasets/?`, data.dataset.id), {
                rows: [row]
            })
        );
    }

    async function getDatasetRows() {
        const { rows } = notify.onErr(await api.get(apiPath(`/datasets/?`, data.dataset.id)));
        return Dataset.sortRowsElementsForDisplay(data.dataset.columns, rows);
    }

    onMount(async () => {
        rows = await getDatasetRows();
    });

    listen.datasetCol.onCreate(async col => {
        if (col.datasetId !== data.dataset.id) return;
        data.dataset.columns = [...data.dataset.columns, col];
    });

    $: columnsOrderedByJsonOrder = Dataset.sortColumnsForJson(data.dataset.columns);
</script>

<svelte:head>
    <title>{data.dataset.name || 'Unknown'} | View Dataset</title>
</svelte:head>

<main class="p-1 md:p-4 md:pl-4">
    <div class="pb-4 flex flex-row justify-between">
        <div class="text-lg">
            <input
                bind:this={nameInp}
                value={data.dataset.name}
                on:change={updateName}
                aria-label="Dataset name"
            />
        </div>
        <div>
            <button
                on:click={deleteDataset}
                class="flex-center gap-2 danger border border-solid border-borderColor py-2 px-4 hover:bg-vLightAccent rounded-full"
                aria-label="Delete this dataset"
            >
                <DeleteOutline size="25" /> Delete
            </button>
        </div>
    </div>

    {#if data.dataset?.preset}
        <div class="flex justify-start items-center gap-2">
            <TuneVariant size="20" />
            <span class="text-light"> From preset '{data.dataset.preset.defaultName}' </span>
        </div>
    {/if}

    {#if rows}
        <section>
            {#if data.dataset && data.dataset.columns.length}
                <DatasetChart dataset={data.dataset} {rows} />
            {/if}
        </section>

        <section class="pt-8 overflow-x-auto">
            <table class="border-borderColor border border-r-0">
                <tr>
                    <th class="p-2 border-r border-borderColor"> Timestamp </th>
                    {#each Dataset.sortColumnsForDisplay(data.dataset.columns) as column}
                        <th
                            class="border-r border-borderColor min-w-[150px] bg-vLightAccent"
                            class:hover:bg-lightAccent={!data.dataset.preset}
                        >
                            {#if !data.dataset.preset}
                                <button
                                    class="group p-2 w-full"
                                    on:click={() =>
                                        showPopup(EditDatasetColumnDialog, {
                                            datasetId: data.dataset.id,
                                            column
                                        })}
                                >
                                    {column.name}
                                    <span class="invisible group-hover:visible">
                                        <Pencil size={18} />
                                    </span>
                                </button>
                            {:else}
                                {column.name}
                            {/if}
                        </th>
                    {/each}
                    <th>
                        {#if !data.dataset.preset}
                            <button
                                class="border border-solid border-borderColor border-l-0 p-2 bg-vLightAccent hover:bg-lightAccent text-light hover:text-textColor"
                                on:click={addColumn}
                            >
                                +
                            </button>
                        {/if}
                    </th>
                </tr>
                {#if rows && rows.length}
                    {#each rows as row}
                        <tr class="p-2 border-t border-borderColor">
                            <td class="p-2 border-r border-borderColor">{row.timestamp}</td>
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
                        </tr>
                    {/each}
                {:else if rows}
                    <tr class="p-2 border-t border-borderColor">
                        <td
                            class="p-2 border border-borderColor italic text-light"
                            colspan={data.dataset.columns.length + 2}
                        >
                            No rows
                        </td>
                    </tr>
                {:else}
                    <tr class="p-2 border-t border-borderColor">
                        <td
                            class="p-2 border border-borderColor italic text-light"
                            colspan={data.dataset.columns.length + 2}
                        >
                            Loading...
                        </td>
                    </tr>
                {/if}
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
            </table>
        </section>
    {:else}
        <div class="pt-8"> Loading... </div>
    {/if}
</main>
