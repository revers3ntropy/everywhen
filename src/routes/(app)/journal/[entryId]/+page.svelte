<script lang="ts">
    import { ANIMATION_DURATION } from '$lib/constants';
    import { fmtUtcRelative } from '$lib/utils/time';
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import ChevronUp from 'svelte-material-icons/ChevronUp.svelte';
    import type { Location } from '$lib/controllers/location/location';
    import { notify } from '$lib/components/notifications/notifications';
    import { api } from '$lib/utils/apiRequest';
    import { onMount } from 'svelte';
    import { Entry as EntryController } from '$lib/controllers/entry/entry';
    import Entry from '$lib/components/entry/Entry.svelte';
    import { navExpanded, obfuscated } from '$lib/stores';
    import type { PageData } from './$types';
    import { slide } from 'svelte/transition';

    export let data: PageData;
    let { entry, showHistory } = data;

    let locations = null as Location[] | null;

    async function loadLocations() {
        locations = notify.onErr(await api.get('/locations')).locations;
    }

    onMount(() => {
        void loadLocations();
    });
</script>

<svelte:head>
    <title>View Entry</title>
</svelte:head>

<main class="md:p-4 {$navExpanded ? 'md:ml-48' : 'md:ml-16'}">
    <div class="text-light p-2 italic">
        {#if EntryController.isDeleted(entry)}
            <p class="text-warning">
                This entry was deleted {fmtUtcRelative(entry.deleted ?? 0)}
            </p>
        {:else if showHistory}
            <div transition:slide={{ duration: ANIMATION_DURATION }}> Current Version </div>
        {/if}
    </div>

    <div class="p-2 md:pt-4 bg-vLightAccent md:rounded-lg md:p-4">
        <Entry
            {...entry}
            obfuscated={$obfuscated}
            on:updated={() => location.reload()}
            showFullDate={true}
            {locations}
        />
    </div>
    {#if entry.edits?.length}
        <div class="flex-center p-4">
            {#if showHistory}
                <button on:click={() => (showHistory = false)} class="flex-center gap-2">
                    <ChevronUp /> Hide History ({entry.edits?.length} edits)
                </button>
            {:else}
                <button on:click={() => (showHistory = true)} class="flex-center gap-2">
                    <ChevronDown /> Show History ({entry.edits?.length} edits)
                </button>
            {/if}
        </div>
        {#if showHistory}
            <div transition:slide={{ duration: ANIMATION_DURATION }}>
                {#if !entry.edits?.length}
                    <div class="flex-center"> No edits have been made to this entry </div>
                {:else}
                    <div class="p-2 text-light italic">Older Versions</div>
                    <div class="p-2 md:pt-4 bg-vLightAccent md:rounded-lg md:p-4">
                        {#each (entry.edits || []).sort((a, b) => b.created - a.created) as edit}
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
                                {locations}
                            />
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
    {/if}
</main>
