<script lang="ts">
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
        await goto('/datasets');
    }

    async function addColumn() {
        const newColumn = notify.onErr(
            await api.post(apiPath(`/datasets/?/columns`, data.dataset.id), {
                name: 'New Column',
                type: 'number'
            })
        );
        data.dataset.columns.push(newColumn);
    }

    async function addRow() {
        const row = {
            elements: Dataset.sortColumnsForJson(data.dataset.columns).map(
                c => c.type.defaultValue
            ),
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

    async function getDatasetRows() {
        const { rows } = notify.onErr(await api.get(apiPath(`/datasets/?`, data.dataset.id)));
        return Dataset.sortRowsElementsForDisplay(data.dataset.columns, rows);
    }

    onMount(async () => {
        rows = await getDatasetRows();
    });
</script>

<svelte:head>
    <title>{data.dataset.name || 'Unknown'} | View Dataset</title>
</svelte:head>

<main class="md:p-4 md:pl-4">
    <div class="pb-4 flex flex-row justify-between">
        <div class="text-lg">
            <input bind:this={nameInp} value={data.dataset.name} on:change={updateName} />
        </div>
        <div>
            <button
                on:click={deleteDataset}
                class="flex-center gap-2 danger border border-solid border-borderColor py-2 px-4 hover:bg-vLightAccent rounded-full"
            >
                <DeleteOutline size="25" /> Delete Dataset
            </button>
        </div>
    </div>

    {#if data.dataset?.preset}
        <div class="flex justify-start items-center gap-2">
            <TuneVariant size="20" />
            <span class="text-light"> From preset '{data.dataset.preset.defaultName}' </span>
        </div>
    {/if}

    <section>
        {#if data.dataset && data.dataset.columns.length}
            <DatasetChart dataset={data.dataset} {rows} />
        {/if}
    </section>

    <section class="pt-8">
        <table class="border-borderColor border border-r-0">
            <tr>
                <th class="p-2 border-r border-borderColor"> Timestamp </th>
                {#each Dataset.sortColumnsForDisplay(data.dataset.columns) as column}
                    <th
                        class="border-r border-borderColor min-w-[150px] bg-vLightAccent hover:bg-lightAccent"
                    >
                        <button
                            class="group p-2"
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
            {#if rows}
                {#each rows as row}
                    <tr class="p-2 border-t border-borderColor">
                        <td class="p-2 border-r border-borderColor">{row.timestamp}</td>
                        {#each row.elements as element}
                            <td class="p-2 border-r border-borderColor">{element}</td>
                        {/each}
                    </tr>
                {/each}
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
</main>
