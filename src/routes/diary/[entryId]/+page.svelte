<script lang="ts">
    import { onMount } from 'svelte';
    import type { App } from '../../../app';
    import Entry from '../../../lib/components/Entry.svelte';
    import type { Entry as EntryController } from '../../../lib/controllers/entry';
    import { obfuscated } from '../../../lib/stores';

    export let data: App.PageData & {
        entry: EntryController,
        history: boolean,
    };

    onMount(() => document.title = `View Entry`);

</script>

<svelte:head>
    <title>View Entry</title>
    <meta content="View Entry" name="description" />
</svelte:head>

<main>
    {#if data.entry.deleted}
        <i>This entry has been deleted. </i>
    {:else}
        <i>Current Version</i>
    {/if}
    <Entry
        {...data.entry}
        auth={data}
        obfuscated={$obfuscated}
        on:updated={() => location.reload()}
        showFullDate={true}
    />

    {#if !data.history}
        {#if data.entry.edits?.length}
            <div class="flex-center">
                <a href="/diary/{data.entry.id}?history=on">
                    Show History
                    ({data.entry.edits?.length} edits)
                </a>
            </div>
        {/if}
    {:else}
        <div class="flex-center">
            <a href="/diary/{data.entry.id}">
                Hide History ({data.entry.edits?.length} edits)
            </a>
        </div>
        {#if !data.entry.edits?.length}
            <div class="flex-center">
                No edits have been made to this entry
            </div>
        {:else}
            <i>Older Versions</i>
            {#each (data.entry.edits || [])
                .sort((a, b) => b.created - a.created) as edit}
                <Entry
                    {...edit}
                    auth={data}
                    obfuscated={$obfuscated}
                    isEdit={true}
                    showFullDate={true}
                />
            {/each}
        {/if}
    {/if}
</main>
