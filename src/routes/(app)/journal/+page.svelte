<script lang="ts">
    import DatasetShortcutWidgets from '$lib/components/dataset/DatasetShortcutWidgets.svelte';
    import EntriesSidebar from '$lib/components/entry/EntriesSidebar.svelte';
    import { navExpanded, obfuscated } from '$lib/stores';
    import type { PageData } from './$types';
    import Feed from '$lib/components/feed/Feed.svelte';

    export let data: PageData;
</script>

<svelte:head>
    <title>Journal</title>
</svelte:head>

<main class="md:flex md:justify-center gap-4 {$navExpanded ? 'md:ml-52' : 'md:ml-20'}">
    <section class="sidebar">
        <EntriesSidebar
            obfuscated={$obfuscated}
            nYearsAgo={data.nYearsAgo}
            pinnedEntriesSummaries={data.pinnedEntriesList}
        />
    </section>

    <section class="w-full max-w-3xl -order-1">
        <div>
            <DatasetShortcutWidgets datasets={data.datasets} />
        </div>

        <Feed
            locations={data.locations}
            happinessDataset={data.happinessDataset}
            labels={data.labels}
            obfuscated={$obfuscated}
        />
    </section>
</main>
