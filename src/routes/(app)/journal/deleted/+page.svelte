<script lang="ts">
    import Entries from '$lib/components/entry/Entries.svelte';
    import { navExpanded } from '$lib/stores';
    import type { PageData } from './$types';

    export let data: PageData;
    const { locations } = data;
</script>

<svelte:head>
    <title>Deleted Entries</title>
</svelte:head>

<main class="md:p-4 {$navExpanded ? 'md:ml-48' : 'md:ml-16'}">
    <Entries
        options={{
            deleted: true
        }}
        {locations}
    />
</main>

<style lang="scss">
    h2 {
        width: 100%;
        text-align: center;
    }
</style>
