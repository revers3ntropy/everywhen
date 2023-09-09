<script lang="ts">
    import DatasetShortcutWidgets from '$lib/components/dataset/DatasetShortcutWidgets.svelte';
    import Entries from '$lib/components/entry/Entries.svelte';
    import EntriesSidebar from '$lib/components/entry/EntriesSidebar.svelte';
    import { encryptionKey, obfuscated } from '$lib/stores';
    import { encrypt } from '$lib/utils/encryption';
    import Search from 'svelte-material-icons/Magnify.svelte';
    import type { PageData } from './$types';

    export let data: PageData;
    let { pinnedEntriesList, datasets, nYearsAgo, locations } = data;

    let search: string;
</script>

<svelte:head>
    <title>Journal</title>
</svelte:head>

<main>
    <section class="sidebar">
        <EntriesSidebar
            obfuscated={$obfuscated}
            {nYearsAgo}
            pinnedEntriesSummaries={pinnedEntriesList}
        />
    </section>

    <section class="feed">
        <div>
            <DatasetShortcutWidgets {datasets} />
        </div>

        <div style="padding: 1rem 0 0 0.5rem;">
            <input bind:value={search} placeholder="Search in entries..." type="text" />
            <button aria-label="search">
                <Search />
            </button>
        </div>

        {#key search}
            <Entries
                showLabels
                showEntryForm
                {locations}
                options={{ search: encrypt(search, $encryptionKey, true) }}
            />
        {/key}
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
