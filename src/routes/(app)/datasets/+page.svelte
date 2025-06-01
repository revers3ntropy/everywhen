<script lang="ts">
    import { listen } from '$lib/dataChangeEvents';
    import type { PageData } from './$types';
    import CreateDatasetButton from './CreateDatasetButton.svelte';
    import DatasetWidget from './DatasetWidget.svelte';

    export let data: PageData;

    listen.dataset.onCreate(dataset => {
        data.datasets = [dataset, ...data.datasets];
    });
    listen.dataset.onDelete(id => {
        data.datasets = data.datasets.filter(dataset => dataset.id !== id);
    });
    listen.dataset.onUpdate(updatedDataset => {
        data.datasets = data.datasets.map(dataset => {
            if (dataset.id === updatedDataset.id) return updatedDataset;
            return dataset;
        });
    });
</script>

<svelte:head>
    <title>Datasets</title>
</svelte:head>

<main class="p-2 md:p-4 md:pl-4 flex-center">
    <div class="w-full md:max-w-4xl">
        <div class="flex items-center gap-4">
            <CreateDatasetButton datasets={data.datasets} />
            <p>
                Strands of Everywhen
                <span class="text-light font-bold border border-border rounded-full py-1 px-2">
                    beta
                </span>
            </p>
        </div>

        <div class="py-4 flex gap-2 flex-wrap" aria-label="list of datasets">
            {#each data.datasets as dataset}
                <DatasetWidget {dataset} />
            {/each}
        </div>
    </div>
</main>
