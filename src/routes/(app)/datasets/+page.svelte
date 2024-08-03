<script lang="ts">
    import type { PageData } from './$types';
    import CreateDatasetButton from './CreateDatasetButton.svelte';
    import DatasetWidget from './DatasetWidget.svelte';

    export let data: PageData;
    const { datasets } = data;
</script>

<svelte:head>
    <title>Datasets</title>
</svelte:head>

<main class="pt-4 md:pl-4">
    <CreateDatasetButton {datasets} />

    <div class="py-4 flex gap-2" aria-label="list of datasets">
        {#each datasets as dataset}
            <DatasetWidget {dataset} />
        {/each}
    </div>
</main>
