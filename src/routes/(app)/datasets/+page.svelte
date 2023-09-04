<script lang="ts">
    import type { PresetId } from '$lib/controllers/dataset/presets';
    import type { PageData } from './$types';
    import { Dataset, type DatasetPresetName } from '$lib/controllers/dataset/dataset';
    import { notify } from '$lib/components/notifications/notifications';
    import { api } from '$lib/utils/apiRequest';

    export let data: PageData;

    let { datasets } = data;

    $: unusedPresetNames = Object.keys(Dataset.datasetPresets).filter(
        name => datasets.filter(dataset => dataset.name === name).length < 1
    ) as PresetId[];

    async function makeFromPreset(presetName: DatasetPresetName) {
        notify.onErr(
            await api.post('/datasets', {
                name: presetName,
                columns: Dataset.datasetPresets[presetName].columns
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
            Start Recording '{presetName}'
        </button>
    {/each}

    {#each datasets as dataset}
        <div class="dataset">
            {dataset.name}
        </div>
    {/each}
</main>

<style lang="less">
    @import '../../../styles/variables';
    @import '../../../styles/layout';

    .dataset {
        .container();
        width: 100px;
        padding: 1rem;
    }
</style>
