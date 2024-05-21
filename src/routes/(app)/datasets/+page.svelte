<script lang="ts">
    import Dot from '$lib/components/ui/Dot.svelte';
    import Dropdown from '$lib/components/ui/Dropdown.svelte';
    import { datasetPresets } from '$lib/controllers/dataset/presets';
    import type { PresetId } from '$lib/controllers/dataset/presets';
    import Import from 'svelte-material-icons/Import.svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
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
    <Dropdown fillWidthMobile width="200px">
        <button
            slot="button"
            class="aspect-square p-2 rounded-full bg-vLightAccent hover:bg-lightAccent"
        >
            <Plus size="24" />
        </button>
        <div class="py-2">
            {#each unusedPresetIds as presetId}
                <div class="p-2">
                    <button
                        on:click={() => makeFromPreset(presetId)}
                        class="w-full flex justify-start items-center gap-2"
                    >
                        <TuneVariant size="20" />
                        {datasetPresets[presetId].defaultName}
                    </button>
                </div>
            {/each}
            <SleepCycleImport {datasets} {usedPresetIds} className="w-full">
                <span class="w-full flex justify-start items-center p-2 gap-2">
                    <Import size="24" />
                    Sleep Cycle
                    <img
                        src="/sleepCycleLogo.png"
                        width="225"
                        height="225"
                        class="rounded-full w-6 h-6"
                        alt="Sleep Cycle logo"
                    />
                </span>
            </SleepCycleImport>
        </div>
    </Dropdown>

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
</main>
