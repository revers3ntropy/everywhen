<script lang="ts">
    import TuneVariant from 'svelte-material-icons/TuneVariant.svelte';
    import Dot from '$lib/components/ui/Dot.svelte';
    import { tooltip } from '@svelte-plugins/tooltips';
    import type { DatasetMetadata } from '$lib/controllers/dataset/dataset.server';

    export let dataset: DatasetMetadata;
</script>

<a
    href="datasets/{dataset.id}"
    class="bg-vLightAccent w-fit p-3 rounded-xl hover:bg-lightAccent hover:no-underline"
>
    <span class="flex justify-start items-center gap-2 pb-2">
        {#if dataset.preset}
            <span use:tooltip={{ content: `From preset '${dataset.preset.defaultName}'` }}>
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
