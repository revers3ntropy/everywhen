<script lang="ts">
    import type { Data } from "$lib/types";
    import EntryForm from "./EntryForm.svelte";
    import Entries from "./Entries.svelte";

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
    />
</main>
