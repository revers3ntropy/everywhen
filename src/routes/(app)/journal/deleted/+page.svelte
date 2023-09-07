<script lang="ts">
    import Dot from '$lib/components/Dot.svelte';
    import Entries from '$lib/components/entry/Entries.svelte';
    import type { PageData } from './$types';

    export let data: PageData;
    const { locations } = data;

    let numberOfEntries: number;
</script>

<svelte:head>
    <title>Deleted Entries</title>
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
        options={{
            deleted: true
        }}
        bind:numberOfEntries
        {locations}
    />
</main>

<style lang="scss">
    h2 {
        width: 100%;
        text-align: center;
    }
</style>
