<script lang="ts">
    import { browser } from '$app/environment';
    import EntriesSidebar from '$lib/components/entry/EntriesSidebar.svelte';
    import { notify } from '$lib/components/notifications/notifications.js';
    import { obfuscated, settingsStore } from '$lib/stores';
    import { Day } from '$lib/utils/day';
    import { currentTzOffset } from '$lib/utils/time';
    import { onMount } from 'svelte';
    import type { PageData } from './$types';
    import Feed from '$lib/components/feed/Feed.svelte';
    import { page } from '$app/stores';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { Entry, type EntrySummary } from '$lib/controllers/entry/entry';

    export let data: PageData;

    const getScrollContainer = (): HTMLElement => {
        if (!browser) return undefined as unknown as HTMLElement;
        return document.getElementsByClassName('root')[0] as HTMLElement;
    };

    // scroll to top of page after navigating
    page.subscribe(() => {
        getScrollContainer()?.scrollTo(0, 0);
    });

    // could be fetched by sidebar...?
    let onThisDayData: Record<string, EntrySummary[]> | null = null;
    onMount(async () => {
        onThisDayData = notify.onErr(
            await api.get('/entries/onThisDay', {
                tz: currentTzOffset(),
                // used as index for cache, not required by API
                // otherwise have to have a cache clear before getting the correct day
                day: Day.todayUsingNativeDate().fmtIso()
            })
        );
    });
</script>

<svelte:head>
    <title>Journal</title>
</svelte:head>

<main class="flex flex-row">
    {#if $settingsStore.showSidebar.value}
        <section>
            <EntriesSidebar
                obfuscated={$obfuscated}
                nYearsAgo={onThisDayData}
                pinnedEntriesSummaries={data.pinnedEntriesList}
                openOnMobile={false}
                labels={data.labels}
                locations={data.locations}
            />
        </section>
    {/if}

    <section class="md:flex md:justify-center gap-4 w-full">
        <div class="max-w-3xl w-full">
            {#key $page}
                {#if $page.url.hash.length > 1}
                    {#await api
                        .get(apiPath('/entries/?', $page.url.hash.slice(1)))
                        .then(notify.onErr)}
                        <p>Loading...</p>
                    {:then entry}
                        <Feed
                            labels={data.labels}
                            locations={data.locations}
                            happinessDataset={data.happinessDataset}
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
                        fromDay={Day.todayUsingNativeDate()}
                        {getScrollContainer}
                    />
                {/if}
            {/key}
        </div>
    </section>
</main>
