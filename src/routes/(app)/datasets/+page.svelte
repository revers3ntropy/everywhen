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

<main class="pt-4 px-2 md:px-4">
    <CreateDatasetButton {datasets} />

    <div class="py-4 flex gap-2 flex-wrap" aria-label="list of datasets">
        {#each datasets as dataset}
            <DatasetWidget {dataset} />
        {/each}
    </div>
</main>
