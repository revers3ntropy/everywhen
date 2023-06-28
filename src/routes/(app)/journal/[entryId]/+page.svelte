<script lang="ts">
    import type { Location } from '$lib/controllers/location';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications';
    import { api } from '$lib/utils/apiRequest';
    import { onMount } from 'svelte';
    import { Entry as EntryController } from '$lib/controllers/entry';
    import Entry from '$lib/components/entry/Entry.svelte';
    import { obfuscated } from '$lib/stores';
    import type { PageData } from './$types';

    export let data: PageData;

    let locations = null as Location[] | null;

    async function loadLocations() {
        locations = displayNotifOnErr(
            await api.get(data, '/locations')
        ).locations;
    }

    onMount(() => {
        void loadLocations();
        document.title = `View Entry`;
    });
</script>

<svelte:head>
    <title>View Entry</title>
    <meta content="View Entry" name="description" />
</svelte:head>

<main>
    {#if EntryController.isDeleted(data.entry)}
        <i>This entry has been deleted. </i>
    {:else if data.history}
        <i>Current Version</i>
    {/if}

    <Entry
        {...data.entry}
        auth={data}
        obfuscated={$obfuscated}
        on:updated={() => location.reload()}
        showFullDate={true}
        hideAgentWidget={!data.settings.showAgentWidgetOnEntries.value}
        {locations}
    />

    {#if !data.history}
        {#if data.entry.edits?.length}
            <div class="flex-center">
                <a href="/journal/{data.entry.id}?history=on&obfuscate=0">
                    Show History ({data.entry.edits?.length} edits)
                </a>
            </div>
        {/if}
    {:else}
        <div class="flex-center">
            <a href="/journal/{data.entry.id}?obfuscate=0">
                Hide History ({data.entry.edits?.length} edits)
            </a>
        </div>
        {#if !data.entry.edits?.length}
            <div class="flex-center">
                No edits have been made to this entry
            </div>
        {:else}
            <i>Older Versions</i>
            {#each (data.entry.edits || []).sort((a, b) => b.created - a.created) as edit}
                <Entry
                    {...edit}
                    auth={data}
                    obfuscated={$obfuscated}
                    isEdit={true}
                    showFullDate={true}
                    hideAgentWidget={!data.settings.showAgentWidgetOnEntries
                        .value}
                    {locations}
                />
            {/each}
        {/if}
    {/if}
</main>
