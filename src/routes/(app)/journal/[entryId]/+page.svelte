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
    {#if EntryController.isDeleted(data.entry)}
        <i>This entry has been deleted. </i>
    {:else if data.history}
        <i>Current Version</i>
    {/if}

    <Entry
        {...data.entry}
        obfuscated={$obfuscated}
        on:updated={() => location.reload()}
        showFullDate={true}
        {locations}
    />

    {#if !data.history}
        {#if data.entry.edits?.length}
            <div class="flex-center">
                <a href="/journal/{data.entry.id}?history=on">
                    Show History ({data.entry.edits?.length} edits)
                </a>
            </div>
        {/if}
    {:else}
        <div class="flex-center">
            <a href="/journal/{data.entry.id}">
                Hide History ({data.entry.edits?.length} edits)
            </a>
        </div>
        {#if !data.entry.edits?.length}
            <div class="flex-center"> No edits have been made to this entry </div>
        {:else}
            <i>Older Versions</i>
            {#each (data.entry.edits || []).sort((a, b) => b.created - a.created) as edit}
                <Entry
                    {...edit}
                    deleted={null}
                    pinned={null}
                    wordCount={-1}
                    obfuscated={$obfuscated}
                    isEdit={true}
                    showFullDate={true}
                    {locations}
                />
            {/each}
        {/if}
    {/if}
</main>
