<script lang="ts">
    import BulletOrStandardEntryForm from '$lib/components/entryForm/ModedEntryForm.svelte';
    import { onMount } from 'svelte';
    import Entries from '$lib/components/entries/Entries.svelte';
    import { obfuscated } from '$lib/stores';
    import type { PageData } from './$types';

    export let data: PageData;

    let clearEntryForm: () => void;

    onMount(() => (document.title = `Journal`));
</script>

<svelte:head>
    <title>Journal</title>
    <meta content="Journal" name="description" />
</svelte:head>

<main>
    <BulletOrStandardEntryForm
        auth={data}
        obfuscated={$obfuscated}
        bind:resetEntryForm={clearEntryForm}
    />
    <Entries
        auth={data}
        showBin={true}
        showImport={true}
        showLabels={true}
        showSearch={true}
        showSidebar={true}
        hideAgentWidget={!data.settings.showAgentWidgetOnEntries.value}
    />
</main>
