<script lang="ts">
    import { ANIMATION_DURATION } from '$lib/constants';
    import { fmtUtcRelative } from '$lib/utils/time';
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import ChevronUp from 'svelte-material-icons/ChevronUp.svelte';
    import { Entry as EntryController } from '$lib/controllers/entry/entry';
    import Entry from '$lib/components/entry/Entry.svelte';
    import { obfuscated } from '$lib/stores';
    import type { PageData } from './$types';
    import { slide } from 'svelte/transition';

    export let data: PageData;

    let showHistory = false;
    $: showHistory = data.showHistory;
</script>

<svelte:head>
    <title>View Entry</title>
</svelte:head>

<main class="md:p-4 md:ml-40">
    <div class="text-light p-2 italic">
        {#if EntryController.isDeleted(data.entry)}
            <p class="text-warning">
                This entry was deleted {fmtUtcRelative(data.entry.deleted ?? 0)}
            </p>
        {:else if showHistory}
            <div transition:slide={{ duration: ANIMATION_DURATION }}> Current Version </div>
        {/if}
    </div>

    <div class="p-2 md:pt-4 bg-vLightAccent md:rounded-lg md:p-4">
        <Entry
            {...data.entry}
            obfuscated={$obfuscated}
            on:updated={() => location.reload()}
            showFullDate={true}
            locations={data.locations}
        />
    </div>
    {#if data.entry.edits?.length}
        <div class="flex-center p-4">
            {#if showHistory}
                <button on:click={() => (showHistory = false)} class="flex-center gap-2">
                    <ChevronUp /> Hide History ({data.entry.edits?.length} edits)
                </button>
            {:else}
                <button on:click={() => (showHistory = true)} class="flex-center gap-2">
                    <ChevronDown /> Show History ({data.entry.edits?.length} edits)
                </button>
            {/if}
        </div>
        {#if showHistory}
            <div transition:slide={{ duration: ANIMATION_DURATION }}>
                {#if !data.entry.edits?.length}
                    <div class="flex-center"> No edits have been made to this entry </div>
                {:else}
                    <div class="p-2 text-light italic">Older Versions</div>
                    <div class="p-2 md:pt-4 bg-vLightAccent md:rounded-lg md:p-4">
                        {#each (data.entry.edits || []).sort((a, b) => b.created - a.created) as edit}
                            <Entry
                                id={edit.id}
                                title={edit.oldTitle}
                                body={edit.oldBody}
                                created={edit.created}
                                createdTzOffset={edit.createdTzOffset}
                                label={edit.oldLabel}
                                latitude={edit.latitude}
                                longitude={edit.longitude}
                                deleted={null}
                                pinned={null}
                                wordCount={-1}
                                agentData={edit.agentData}
                                edits={[]}
                                isEdit
                                showFullDate
                                obfuscated={$obfuscated}
                                locations={data.locations}
                            />
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
    {/if}
</main>
