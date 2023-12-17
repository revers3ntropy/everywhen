<script lang="ts">
    import DatasetShortcutWidgets from '$lib/components/dataset/DatasetShortcutWidgets.svelte';
    import { navExpanded, obfuscated } from '$lib/stores';
    import type { PageData } from './$types';
    import Feed from '$lib/components/feed/Feed.svelte';

    export let data: PageData;

    const feedContainer = () => document.getElementsByClassName('root')[0] as HTMLDivElement;
</script>

<svelte:head>
    <title>Journal</title>
</svelte:head>

<main class={$navExpanded ? 'md:ml-52' : 'md:ml-20'}>
    <div style="width: min(100%, 732px)">
        <div class="pb-4">
            <DatasetShortcutWidgets datasets={data.datasets} />
        </div>

        <Feed
            locations={data.locations}
            happinessDataset={data.happinessDataset}
            labels={data.labels}
            obfuscated={$obfuscated}
            container={feedContainer}
        />
    </div>
</main>

<style lang="scss">
    @import '$lib/styles/layout';

    main {
        display: flex;
        justify-content: center;
        gap: 1rem;

        @media #{$mobile} {
            display: block;
        }
    }
</style>
