<script lang="ts">
    import type { Location } from '$lib/controllers/location/location';
    import { notify } from '$lib/components/notifications/notifications';
    import { api } from '$lib/utils/apiRequest';
    import { onMount } from 'svelte';
    import { Entry as EntryController } from '$lib/controllers/entry/entry';
    import Entry from '$lib/components/entry/Entry.svelte';
    import { obfuscated } from '$lib/stores';
    import type { PageData } from './$types';

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

<main>
    {#if EntryController.isDeleted(entry)}
        <i>This entry has been deleted. </i>
    {:else if showHistory}
        <i>Current Version</i>
    {/if}

    <Entry
        {...entry}
        obfuscated={$obfuscated}
        on:updated={() => location.reload()}
        showFullDate={true}
        {locations}
    />

    {#if !showHistory}
        {#if entry.edits?.length}
            <div class="flex-center">
                <a href="/journal/{entry.id}?history=on">
                    Show History ({entry.edits?.length} edits)
                </a>
            </div>
        {/if}
    {:else}
        <div class="flex-center">
            <a href="/journal/{entry.id}">
                Hide History ({entry.edits?.length} edits)
            </a>
        </div>
        {#if !entry.edits?.length}
            <div class="flex-center"> No edits have been made to this entry </div>
        {:else}
            <i>Older Versions</i>
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
        {/if}
    {/if}
</main>
