<script lang="ts">
    import EntryForm from "./EntryForm.svelte";
    import Entries from "../../lib/components/Entries.svelte";
    import type { PageData } from './$types';

    export let data: PageData;
    let clearEntryForm: () => void;
    let reloadEntries;

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
