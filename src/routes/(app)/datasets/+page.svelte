<script lang="ts">
    import { datasetPresets } from '$lib/controllers/dataset/presets';
    import type { PresetId } from '$lib/controllers/dataset/presets';
    import type { PageData } from './$types';
    import { makeFromPreset } from './importHelpers';
    import SleepCycleImport from './SleepCycleImport.svelte';

    export let data: PageData;
    const { datasets } = data;

    $: usedPresetIds = datasets.map(({ preset }) => preset?.id).filter(Boolean);
    $: unusedPresetIds = Object.keys(datasetPresets).filter(
        presetId => !usedPresetIds.includes(presetId)
    ) as PresetId[];
</script>

<svelte:head>
    <title>Datasets</title>
</svelte:head>

<main class="mt-4 md:ml-[10.5rem]">
    {#each unusedPresetIds as presetId}
        <div class="py-2">
            <button on:click={() => makeFromPreset(presetId)}>
                Start Recording '{datasetPresets[presetId].defaultName}'
            </button>
        </div>
    {/each}

    <div class="py-4">
        {#each datasets as dataset}
            <div class="bg-lightAccent w-fit p-3 rounded-xl">
                {dataset.name}
            </div>
        {/each}
    </div>

    <div>
        <SleepCycleImport {datasets} {usedPresetIds} />
    </div>
</main>
