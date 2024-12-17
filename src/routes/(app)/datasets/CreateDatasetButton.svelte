<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications';
    import type { DatasetMetadata } from '$lib/controllers/dataset/dataset';
    import { makeBlank, makeFromPreset } from './importHelpers';
    import { datasetPresets, type PresetId } from '$lib/controllers/dataset/presets';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import TuneVariant from 'svelte-material-icons/TuneVariant.svelte';
    import Dropdown from '$lib/components/ui/Dropdown.svelte';
    import SleepCycleImport from './SleepCycleImport.svelte';
    import Import from 'svelte-material-icons/Import.svelte';
    import FileOutline from 'svelte-material-icons/FileOutline.svelte';

    export let datasets: DatasetMetadata[];

    $: usedPresetIds = datasets.map(({ preset }) => preset?.id).filter(Boolean);
    $: unusedPresetIds = Object.keys(datasetPresets).filter(
        presetId => !usedPresetIds.includes(presetId)
    ) as PresetId[];
    $: datasetNames = datasets.map(({ name }) => name);
</script>

<Dropdown
    fillWidthMobile
    width="200px"
    buttonProps={{ 'aria-label': 'Open popup to create dataset' }}
>
    <span
        slot="button"
        class="aspect-square p-2 rounded-full bg-vLightAccent hover:bg-lightAccent flex-center"
    >
        <Plus size="24" />
    </span>
    <div class="py-2">
        <div class="p-2">
            <button
                on:click={() => makeBlank(datasetNames)}
                class="w-full flex justify-start items-center gap-2"
                aria-label="Create blank dataset"
            >
                <FileOutline size="20" />
                Blank
            </button>
        </div>
        {#each unusedPresetIds as presetId}
            <div class="p-2">
                <button
                    on:click={() => makeFromPreset(presetId).then(notify.onErr)}
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
