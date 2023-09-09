<script lang="ts">
    import { datasetPresets } from '$lib/controllers/dataset/presets';
    import type { PresetId } from '$lib/controllers/dataset/presets';
    import type { PageData } from './$types';
    import { notify } from '$lib/components/notifications/notifications';
    import { api } from '$lib/utils/apiRequest';

    export let data: PageData;
    const { datasets } = data;

    const usedPresetIds = datasets.map(({ preset }) => preset?.id).filter(Boolean);
    const unusedPresetIds = Object.keys(datasetPresets).filter(
        presetId => !usedPresetIds.includes(presetId)
    ) as PresetId[];

    async function makeFromPreset(presetId: PresetId) {
        notify.onErr(
            await api.post('/datasets', {
                name: datasetPresets[presetId].defaultName,
                presetId
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

    {#each unusedPresetIds as presetId}
        <div>
            <button on:click={() => makeFromPreset(presetId)}>
                Start Recording '{datasetPresets[presetId].defaultName}'
            </button>
        </div>
    {/each}

    {#each datasets as dataset}
        <div class="dataset">
            {dataset.name}
        </div>
    {/each}
</main>

<style lang="scss">
    @import '$lib/styles/layout';

    .dataset {
        @extend .container;
        width: 100px;
        padding: 1rem;
    }
</style>
