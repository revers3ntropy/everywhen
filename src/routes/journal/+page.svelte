<script lang="ts">
    import { onMount } from 'svelte';
    import Entries from '$lib/components/Entries.svelte';
    import { obfuscated } from '$lib/stores';
    import EntryForm from './EntryForm.svelte';

    export let data: App.PageData;

    let clearEntryForm: () => void;
    let reloadEntries: () => Promise<void>;

    onMount(() => (document.title = `Journal`));
</script>

<svelte:head>
    <title>Journal</title>
    <meta content="Journal" name="description" />
</svelte:head>

<main>
    <EntryForm
        auth={data}
        bind:reset={clearEntryForm}
        obfuscated={$obfuscated}
        on:updated={reloadEntries}
    />
    <Entries
        auth={data}
        bind:reload={reloadEntries}
        showBin={true}
        showImport={true}
        showLabels={true}
        showSearch={true}
        showSidebar={true}
        hideAgentWidget={!data.settings.showAgentWidgetOnEntries.value}
    />
</main>
