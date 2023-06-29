<script lang="ts">
    import Dot from '$lib/components/Dot.svelte';
    import Entries from '$lib/components/entry/Entries.svelte';
    import { onMount } from 'svelte';
    import type { PageData } from './$types';

    export let data: PageData;

    let numberOfEntries: number;

    onMount(() => (document.title = `Deleted`));
</script>

<svelte:head>
    <title>Deleted</title>
    <meta content="Deleted" name="description" />
</svelte:head>

<main>
    <h2>
        Bin
        {#if numberOfEntries !== null && numberOfEntries !== Infinity}
            <Dot light />
            <span class="text-light">{numberOfEntries}</span>
        {/if}
    </h2>
    <Entries
        auth={data.auth}
        hideAgentWidget={!data.settings.showAgentWidgetOnEntries.value}
        options={{
            deleted: true
        }}
        bind:numberOfEntries
    />
</main>

<style lang="less">
    h2 {
        width: 100%;
        text-align: center;
    }
</style>
