<script lang="ts">
    import { browser } from '$app/environment';
    import DatasetShortcutWidgets from '$lib/components/dataset/DatasetShortcutWidgets.svelte';
    import EntriesSidebar from '$lib/components/entry/EntriesSidebar.svelte';
    import { notify } from '$lib/components/notifications/notifications.js';
    import { navExpanded, obfuscated } from '$lib/stores';
    import { Day } from '$lib/utils/day';
    import { currentTzOffset } from '$lib/utils/time';
    import type { PageData } from './$types';
    import Feed from '$lib/components/feed/Feed.svelte';
    import { page } from '$app/stores';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { Entry } from '$lib/controllers/entry/entry';

    export let data: PageData;

    const getScrollContainer = (): HTMLElement => {
        if (!browser) return undefined as unknown as HTMLElement;
        return document.getElementsByClassName('root')[0] as HTMLElement;
    };

    page.subscribe(() => {
        getScrollContainer()?.scrollTo(0, 0);
    });
</script>

<svelte:head>
    <title>Journal</title>
</svelte:head>

<main class="md:flex md:justify-center gap-4 {$navExpanded ? 'md:ml-52' : 'md:ml-20'}">
    <section>
        <EntriesSidebar
            obfuscated={$obfuscated}
            nYearsAgo={data.nYearsAgo}
            pinnedEntriesSummaries={data.pinnedEntriesList}
            openOnMobile={false}
        />
    </section>

    <section class="w-full max-w-3xl -order-1">
        <div>
            <DatasetShortcutWidgets datasets={data.datasets} />
        </div>
        {#key $page}
            {#if $page.url.hash}
                {#await api.get(apiPath('/entries/?', $page.url.hash.slice(1))).then(notify.onErr)}
                    <p>Loading...</p>
                {:then entry}
                    <Feed
                        locations={data.locations}
                        happinessDataset={data.happinessDataset}
                        labels={data.labels}
                        obfuscated={$obfuscated}
                        fromDay={Entry.dayOf(entry)}
                        {getScrollContainer}
                    />
                {:catch error}
                    <p>{error.message}</p>
                {/await}
            {:else}
                <Feed
                    locations={data.locations}
                    happinessDataset={data.happinessDataset}
                    labels={data.labels}
                    obfuscated={$obfuscated}
                    fromDay={Day.today(currentTzOffset())}
                    {getScrollContainer}
                />
            {/if}
        {/key}
    </section>
</main>
