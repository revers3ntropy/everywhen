<script lang="ts">
    import DatasetShortcutWidgets from '$lib/components/dataset/DatasetShortcutWidgets.svelte';
    import EntriesSidebar from '$lib/components/entry/EntriesSidebar.svelte';
    import { navExpanded, obfuscated } from '$lib/stores';
    import type { PageData } from './$types';
    import Feed from '$lib/components/feed/Feed.svelte';

    export let data: PageData;
    let { pinnedEntriesList, datasets, nYearsAgo, locations } = data;
</script>

<svelte:head>
    <title>Journal</title>
</svelte:head>

<main class={$navExpanded ? 'md:ml-52' : 'md:ml-20'}>
    <section class="sidebar">
        <EntriesSidebar
            obfuscated={$obfuscated}
            {nYearsAgo}
            pinnedEntriesSummaries={pinnedEntriesList}
        />
    </section>

    <section class="feed">
        <div class="pb-4">
            <DatasetShortcutWidgets {datasets} />
        </div>

        <Feed {locations} />
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
