<script lang="ts">
    import { EntryFormMode } from '$lib/components/entryForm/entryFormMode';
    import Entries from '$lib/components/entry/Entries.svelte';
    import type { PageData } from './$types';
    import { settingsStore } from '$lib/stores';

    export let data: PageData;

    $: entryFormMode = $settingsStore.entryFormMode.value
        ? EntryFormMode.Bullet
        : EntryFormMode.Standard;
</script>

<svelte:head>
    <title>Journal</title>
</svelte:head>

<main>
    <Entries showBin showLabels showSearch showSidebar showEntryForm {entryFormMode} />
</main>
