<script lang="ts">
    import type { Data } from "$lib/types";
    import EntryForm from "./EntryForm.svelte";
    import Entries from "../../lib/components/Entries.svelte";

    export let data: Data;
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
