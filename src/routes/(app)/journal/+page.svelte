<script lang="ts">
    import { EntryFormMode } from '$lib/components/entryForm/entryFormMode';
    import { listen } from '$lib/dataChangeEvents';
    import { onMount } from 'svelte';
    import Entries from '$lib/components/entry/Entries.svelte';
    import type { PageData } from './$types';

    export let data: PageData;

    let entryFormMode = data?.settings.entryFormMode.value
        ? EntryFormMode.Bullet
        : EntryFormMode.Standard;

    listen.setting.onUpdate(({ key, value }) => {
        if (key === 'entryFormMode') {
            entryFormMode = value ? EntryFormMode.Bullet : EntryFormMode.Standard;
        }
    });

    onMount(() => (document.title = `Journal`));
</script>

<svelte:head>
    <title>Journal</title>
    <meta content="Journal" name="description" />
</svelte:head>

<main>
    <Entries
        auth={data.auth}
        showBin
        showLabels
        showSearch
        showSidebar
        showEntryForm
        hideAgentWidget={!data.settings.showAgentWidgetOnEntries.value}
        {entryFormMode}
    />
</main>
