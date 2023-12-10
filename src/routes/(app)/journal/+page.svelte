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

<main class={$navExpanded ? 'md:ml-52' : 'md:ml-20'}>
    <section class="sidebar">
        <EntriesSidebar
            obfuscated={$obfuscated}
            nYearsAgo={data.nYearsAgo}
            pinnedEntriesSummaries={data.pinnedEntriesList}
        />
    </section>

    <section class="feed">
        <div class="pb-4">
            <DatasetShortcutWidgets datasets={data.datasets} />
        </div>

        <Feed
            locations={data.locations}
            happinessDataset={data.happinessDataset}
            labels={data.labels}
        />
    </section>
</main>

<style lang="scss">
    @import '$lib/styles/layout';

    main {
        display: flex;
        justify-content: center;
        gap: 1rem;

        .sidebar {
            width: 300px;
        }

        .feed {
            // put the sidebar button above on mobile,
            // but have the sidebar on the right for desktop
            order: -1;
            width: min(100%, 732px);
        }

        @media #{$mobile} {
            display: block;
        }
    }
</style>
