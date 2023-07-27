<script lang="ts">
    import type { PageData } from './$types';
    import { Dataset, type DatasetPresetName } from '$lib/controllers/dataset/dataset.client';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications';
    import { api } from '$lib/utils/apiRequest';

    export let data: PageData;

    $: unusedPresetNames = Object.keys(Dataset.dataSetPresets).filter(
        name => data.datasets.filter(dataset => dataset.name === name).length < 1
    ) as DatasetPresetName[];

    async function makeFromPreset(presetName: DatasetPresetName) {
        displayNotifOnErr(
            await api.post(data.auth, '/datasets', {
                name: presetName,
                columns: Dataset.dataSetPresets[presetName].columns
            })
        );
        location.reload();
    }
</script>

<svelte:head>
    <title>Datasets</title>
</svelte:head>

<main>
    <h1>Datasets</h1>

    {#each unusedPresetNames as presetName}
        <button on:click={() => makeFromPreset(presetName)}>
            {presetName}
        </button>
    {/each}
    {#each data.datasets as dataset}
        <div>
            {dataset.name}
        </div>
    {/each}
</main>

<style lang="less">
    @import '../../../styles/variables';
    @import '../../../styles/layout';
</style>
