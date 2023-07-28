<script lang="ts">
    import type { User } from '$lib/controllers/user/user';
    import type { Dataset } from '$lib/controllers/dataset/dataset';
    import WeightDatasetShortcut from './WeightDatasetShortcut.svelte';

    export let user: User;
    export let datasets: Dataset[];

    $: datasetsByName = datasets.reduce(
        (acc, dataset) => {
            acc[dataset.name] = dataset;
            return acc;
        },
        {} as Record<string, Dataset>
    );
</script>

<div class="wrapper">
    <WeightDatasetShortcut auth={user} dataset={datasetsByName['Weight'] || null} />
</div>

<style lang="less">
    .wrapper {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: start;
    }
</style>
