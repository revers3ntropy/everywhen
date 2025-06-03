<script lang="ts">
    import FileOutline from 'svelte-material-icons/FileOutline.svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import Import from 'svelte-material-icons/Import.svelte';
    import TuneVariant from 'svelte-material-icons/TuneVariant.svelte';
    import * as Popover from '$lib/components/ui/popover';
    import { notify } from '$lib/components/notifications/notifications';
    import type { DatasetMetadata } from '$lib/controllers/dataset/dataset';
    import { datasetPresets, type PresetId } from '$lib/controllers/dataset/presets';
    import SleepCycleImport from './SleepCycleImport.svelte';
    import FitbitSleep from './FitbitSleep.svelte';
    import { makeBlank, makeFromPreset } from './importHelpers';

    export let datasets: DatasetMetadata[];

    $: usedPresetIds = datasets.map(({ preset }) => preset?.id).filter(Boolean);
    $: unusedPresetIds = Object.keys(datasetPresets).filter(
        presetId => !usedPresetIds.includes(presetId)
    ) as PresetId[];
    $: datasetNames = datasets.map(({ name }) => name);
</script>

<Popover.Root>
    <Popover.Trigger
        class="aspect-square p-2 rounded-full bg-vLightAccent hover:bg-lightAccent flex-center"
    >
        <Plus size="24" />
    </Popover.Trigger>
    <Popover.Content class="py-2 px-0">
        <p class="font-bold p-2">Create new Strand</p>
        <button
            on:click={() => makeBlank(datasetNames)}
            class="w-full flex justify-start items-center gap-2 hover:bg-vLightAccent p-2"
            aria-label="Create blank dataset"
        >
            <FileOutline size="20" />
            Blank
        </button>

        {#each unusedPresetIds as presetId}
            <button
                on:click={() => makeFromPreset(presetId).then(notify.onErr)}
                class="w-full flex justify-start items-center gap-2 p-2 hover:bg-vLightAccent"
            >
                <TuneVariant size="20" />
                {datasetPresets[presetId].defaultName}
            </button>
        {/each}
        <SleepCycleImport {datasets} {usedPresetIds} className="w-full">
            <span class="w-full flex justify-start items-center p-2 gap-2 hover:bg-vLightAccent">
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
        <FitbitSleep {datasets} {usedPresetIds} className="w-full">
            <span class="w-full flex justify-start items-center p-2 gap-2 hover:bg-vLightAccent">
                <Import size="24" />
                Fitbit Sleep
                <img
                    src="/fitbit.png"
                    width="225"
                    height="224"
                    class="rounded-full w-6 h-6"
                    alt="Fitbit logo"
                />
            </span>
        </FitbitSleep>
    </Popover.Content>
</Popover.Root>
