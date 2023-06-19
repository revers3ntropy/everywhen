<script lang="ts">
    import BulletOrStandardEntryForm from '$lib/components/entryForm/ModedEntryForm.svelte';
    import { onMount } from 'svelte';
    import Entries from '$lib/components/entry/Entries.svelte';
    import { obfuscated } from '$lib/stores';
    import type { PageData } from './$types';

    export let data: PageData;

    onMount(() => (document.title = `Journal`));
</script>

<svelte:head>
    <title>Journal</title>
    <meta content="Journal" name="description" />
</svelte:head>

<main>
    <BulletOrStandardEntryForm auth={data} obfuscated={$obfuscated} />
    <Entries
        auth={data}
        showBin
        showLabels
        showSearch
        showSidebar
        hideAgentWidget={!data.settings.showAgentWidgetOnEntries.value}
    />
</main>
