<script lang="ts">
    import type { App } from '../../../app';
    import Entry from '../../../lib/components/Entry.svelte';
    import { obfuscated } from '../../../lib/constants.js';
    import type { Entry as EntryController } from '../../../lib/controllers/entry';

    export let data: App.PageData & EntryController;
</script>

<svelte:head>
    <title>View Entry</title>
    <meta content="View Entry" name="description" />
</svelte:head>

<main>
    <Entry {...data} auth={data} obfuscated={$obfuscated} />
</main>
