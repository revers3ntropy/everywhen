<script lang="ts">
    import { onMount } from 'svelte';
    import TuneVariant from 'svelte-material-icons/TuneVariant.svelte';
    import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
    import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
    import { Button } from '$lib/components/ui/button';
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import { dispatch, listen } from '$lib/dataChangeEvents';
    import { goto } from '$app/navigation';
    import { notify } from '$lib/components/notifications/notifications';
    import { Dataset, type DatasetRow } from '$lib/controllers/dataset/dataset';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import type { PageData } from './$types';
    import DatasetChart from './DatasetChart.svelte';
    import TableOfDatapoints from './TableOfDatapoints.svelte';

    export let data: PageData;

    let nameInp: HTMLInputElement;
    let rows: DatasetRow[];

    async function updateName() {
        notify.onErr(
            await api.put(apiPath(`/datasets/?`, data.dataset.id), { name: nameInp.value })
        );
        await dispatch.update(
            'dataset',
            { ...data.dataset },
            { ...data.dataset, name: nameInp.value }
        );
    }

    async function deleteDataset() {
        if (!confirm('Are you sure you want to delete this dataset?')) return;
        notify.onErr(await api.delete(apiPath(`/datasets/?`, data.dataset.id)));
        await dispatch.delete('dataset', data.dataset.id);
    }

    async function getDatasetRows() {
        const { rows } = notify.onErr(await api.get(apiPath(`/datasets/?`, data.dataset.id)));
        return Dataset.sortRowsElementsForDisplay(data.dataset.columns, rows);
    }

    onMount(async () => {
        rows = await getDatasetRows();
    });

    listen.dataset.onDelete(async id => {
        if (id !== data.dataset.id) return;
        await goto('/datasets');
    });
    listen.dataset.onUpdate((_, newDataset) => {
        if (newDataset.id !== data.dataset.id) return;
        data.dataset = newDataset;
    });

    listen.datasetCol.onCreate(col => {
        if (col.datasetId !== data.dataset.id) return;
        data.dataset.columns = [...data.dataset.columns, col];
        rows = rows.map(r => {
            const newRow = { ...r };
            newRow.elements = [...newRow.elements, col.type.defaultValue];
            return newRow;
        });
    });
    listen.datasetCol.onUpdate((_, col) => {
        if (col.datasetId !== data.dataset.id) return;
        data.dataset.columns = data.dataset.columns.map(c => (c.id === col.id ? col : c));
        // TODO update the data types of rows if a column type changes
    });
    listen.datasetCol.onDelete(({ datasetId, columnId }) => {
        if (datasetId !== data.dataset.id) return;
        data.dataset.columns = data.dataset.columns.filter(c => c.id !== columnId);
    });

    listen.datasetRow.onCreate(async ({ datasetId, row }) => {
        if (datasetId !== data.dataset.id) return;
        // TODO how should this be sorted
        rows = [row, ...rows];
        data.dataset.rowCount++;
    });
    listen.datasetRow.onUpdate(async (_, { datasetId, row }) => {
        if (datasetId !== data.dataset.id) return;
        rows = rows.map(r => (r.id === row.id ? row : r));
    });
    listen.datasetRow.onDelete(async ({ datasetId, rowId }) => {
        if (datasetId !== data.dataset.id) return;
        rows = rows.filter(r => r.id !== rowId);
    });
</script>

<svelte:head>
    <title>{data.dataset.name || 'Unknown'} | View Dataset</title>
</svelte:head>

<main class="p-2 md:p-4 md:pl-4 flex-center">
    <div class="w-full md:max-w-6xl">
        <div class="pb-2">
            <a href="/datasets">
                <Button variant="outline" class="border-border text-textColor rounded-xl gap-2">
                    <ArrowLeft size={24} /> All Strands
                </Button>
            </a>
        </div>
        <div class="pb-4 md:flex flex-row justify-between">
            <div class="text-lg">
                <Textbox
                    label="Name"
                    value={data.dataset.name}
                    onChange={updateName}
                    bind:element={nameInp}
                    ariaLabel="dataset name"
                />
            </div>
            <div class="pt-2">
                <button
                    on:click={deleteDataset}
                    class="flex-center gap-2 danger border border-solid border-borderColor py-2 px-4 hover:bg-vLightAccent rounded-xl"
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

        {#key data.dataset.columns}
            {#if rows}
                <section>
                    {#if data.dataset && data.dataset.columns.length}
                        <DatasetChart dataset={data.dataset} {rows} />
                    {/if}
                </section>

                <TableOfDatapoints dataset={data.dataset} {rows} />
            {:else}
                <div class="pt-8"> Loading... </div>
            {/if}
        {/key}
    </div>
</main>
