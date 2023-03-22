<script lang="ts">
    import { onMount } from 'svelte';
    import type { App } from '../../../app';
    import Entry from '../../../lib/components/Entry.svelte';
    import type { Entry as EntryController } from '../../../lib/controllers/entry';
    import { obfuscated } from '../../../lib/stores';

    export let data: App.PageData & EntryController;

    onMount(() => document.title = `View Entry`);

</script>

<svelte:head>
    <title>View Entry</title>
    <meta content="View Entry" name="description" />
</svelte:head>

<main>
    <Entry {...data} auth={data} obfuscated={$obfuscated} />
</main>
