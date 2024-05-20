<script lang="ts">
    import Dot from '$lib/components/ui/Dot.svelte';
    import { datasetPresets } from '$lib/controllers/dataset/presets';
    import type { PresetId } from '$lib/controllers/dataset/presets';
    import type { PageData } from './$types';
    import { makeFromPreset } from './importHelpers';
    import SleepCycleImport from './SleepCycleImport.svelte';
    import { tooltip } from '@svelte-plugins/tooltips';
    import TuneVariant from 'svelte-material-icons/TuneVariant.svelte';

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

    <div class="py-4 flex gap-2">
        {#each datasets as dataset}
            <a href="datasets/{dataset.id}" class="bg-lightAccent w-fit p-3 rounded-xl">
                <span class="flex justify-start items-center gap-2 pb-2">
                    {#if dataset.preset}
                        <span
                            use:tooltip={{ content: `From preset '${dataset.preset.defaultName}'` }}
                        >
                            <span
                                class="border border-borderHeavy rounded-full p-1 inline-flex content-center justify-center"
                            >
                                <TuneVariant size="20" />
                            </span>
                        </span>
                    {/if}
                    {dataset.name}
                </span>
                <span>
                    <span class="text-textColorLight">
                        {dataset.rowCount} rows
                        <Dot />
                        {dataset.columns.length} columns
                    </span>
                </span>
            </a>
        {/each}
    </div>

    <div>
        <SleepCycleImport {datasets} {usedPresetIds} />
    </div>
</main>
