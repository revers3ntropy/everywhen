<script lang="ts">
    import { slide } from 'svelte/transition';
    import UploadMultiple from 'svelte-material-icons/UploadMultiple.svelte';
    import InsertImage from '$lib/components/asset/InsertImage.svelte';
    import FormatOptions from '$lib/components/entryForm/FormatOptions.svelte';
    import LabelSelect from '$lib/components/label/LabelSelect.svelte';
    import LocationToggle from '$lib/components/location/LocationToggle.svelte';
    import { ANIMATION_DURATION } from '$lib/constants';
    import { currentlyUploadingAssets } from '$lib/stores';
    import type { Label } from '$lib/controllers/label/label';

    export let labels: Record<string, Label>;
    export let wrapSelectedWith: (
        before: string,
        after: string,
        insertSpaceIfEmpty: boolean
    ) => void;
    export let newEntryLabelId: string;

    function insertImage(md: string) {
        wrapSelectedWith(md, '', false);
    }

    function makeWrapper(before: string, after: string, insertSpaceIfEmpty = true): () => void {
        return () => {
            wrapSelectedWith(before, after, insertSpaceIfEmpty);
        };
    }
</script>

<div class="flex items-center bg-lightAccent md:rounded-full md:w-fit">
    <div class="flex items-center gap-2 py-1 px-2 md:px-4 w-fit">
        <LocationToggle size={23} />

        <FormatOptions {makeWrapper} />

        <InsertImage onInput={insertImage} />

        <div class="pl-2">
            <LabelSelect bind:value={newEntryLabelId} {labels} />
        </div>
    </div>

    {#if $currentlyUploadingAssets > 0}
        <div
            class="flex-center h-full px-2 py-1 border border-textColor rounded-full"
            transition:slide={{ duration: ANIMATION_DURATION, axis: 'x' }}
        >
            <UploadMultiple size="26" />
            {$currentlyUploadingAssets}
        </div>
    {/if}
</div>
