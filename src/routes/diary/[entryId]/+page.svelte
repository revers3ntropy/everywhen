<script lang="ts">
    import type { App } from '../../../app';
    import Entry from '../../../lib/components/Entry.svelte';
    import { obfuscated } from '../../../lib/constants.js';

    export let data: App.PageData;
</script>

<svelte:head>
    <title>View Entry</title>
    <meta content="View Entry" name="description" />
</svelte:head>

<main>
    <Entry {...data} auth={data} obfuscated={$obfuscated} />
</main>
