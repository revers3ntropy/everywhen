<script lang="ts">
    import TuneVariant from 'svelte-material-icons/TuneVariant.svelte';
    import * as Tooltip from '$lib/components/ui/tooltip';
    import Dot from '$lib/components/ui/Dot.svelte';
    import type { DatasetMetadata } from '$lib/controllers/dataset/dataset.server';

    export let dataset: DatasetMetadata;
</script>

<a
    href="datasets/{dataset.id}"
    aria-label="View dataset '{dataset.name}'"
    class="bg-vLightAccent w-fit p-3 rounded-xl hover:bg-lightAccent hover:no-underline"
>
    <span class="flex justify-start items-center gap-2 pb-2">
        {#if dataset.preset}
            <Tooltip.Root>
                <Tooltip.Trigger>
                    <span
                        class="border border-borderHeavy rounded-full p-1 inline-flex content-center justify-center"
                    >
                        <TuneVariant size="20" />
                    </span>
                </Tooltip.Trigger>
                <Tooltip.Content>
                    From preset '{dataset.preset.defaultName}'
                </Tooltip.Content>
            </Tooltip.Root>
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
