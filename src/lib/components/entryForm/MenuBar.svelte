<script lang="ts">
    import Close from 'svelte-material-icons/Close.svelte';
    import { slide } from 'svelte/transition';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import UploadMultiple from 'svelte-material-icons/UploadMultiple.svelte';
    import * as Tooltip from '$lib/components/ui/tooltip';
    import { Button } from '$lib/components/ui/button/index.js';
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import InsertImage from '$lib/components/asset/InsertImage.svelte';
    import FormatOptions from '$lib/components/entryForm/FormatOptions.svelte';
    import LabelSelect from '$lib/components/label/LabelSelect.svelte';
    import LocationToggle from '$lib/components/location/LocationToggle.svelte';
    import { ANIMATION_DURATION } from '$lib/constants';
    import { currentlyUploadingAssets } from '$lib/stores';
    import type { Label } from '$lib/controllers/label/label';
    import { cn } from '$lib/utils';

    export let labels: Record<string, Label>;
    export let wrapSelectedWith: (
        before: string,
        after: string,
        insertSpaceIfEmpty: boolean
    ) => void;
    export let newEntryLabelId: string;
    export let entryTitle: string;
    let className = '';
    export { className as class };

    let userHasShownTitle = false;

    $: showingEntryTitle = userHasShownTitle || !!entryTitle;

    function insertImage(md: string) {
        wrapSelectedWith(md, '', false);
    }

    function makeWrapper(before: string, after: string, insertSpaceIfEmpty = true): () => void {
        return () => {
            wrapSelectedWith(before, after, insertSpaceIfEmpty);
        };
    }
</script>

<div class={cn('flex items-center bg-lightAccent md:rounded-full md:w-fit', className)}>
    <div class="flex items-center p-1 w-fit">
        <LocationToggle size={23} />

        <FormatOptions {makeWrapper} />

        <InsertImage onInput={insertImage} />

        <div>
            <Button
                variant="outline"
                class="bg-transparent px-2 text-md gap-1 hover:bg-vLightAccent rounded-full hover:text-textColor"
                on:click={() => (userHasShownTitle = true)}
                disabled={showingEntryTitle}
            >
                <Plus size="26" /> Title
            </Button>
        </div>

        <LabelSelect bind:value={newEntryLabelId} {labels} />
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

{#if showingEntryTitle}
    <div class="px-1 flex items-center justify-start gap-2">
        <Textbox bind:value={entryTitle} label="Title" />

        {#if !entryTitle}
            <Tooltip.Root>
                <Tooltip.Trigger>
                    <Button
                        variant="outline"
                        class="bg-transparent border-none flex-center hover:bg-lightAccent rounded-full p-2 mt-2"
                        on:click={() => (userHasShownTitle = false)}
                    >
                        <Close size={20} />
                    </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>Hide title</Tooltip.Content>
            </Tooltip.Root>
        {/if}
    </div>
{/if}
