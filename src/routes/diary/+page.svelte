<script lang="ts">
    import { onMount } from 'svelte';
    import type { App } from '../../app';
    import Entries from '../../lib/components/Entries.svelte';
    import EntryForm from './EntryForm.svelte';

    export let data: App.PageData;

    let clearEntryForm: () => void;
    let reloadEntries: () => Promise<void>;

    onMount(() => document.title = `Diary`);

</script>

<main>
    <EntryForm
        auth={data}
        bind:reset={clearEntryForm}
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
    />
</main>
