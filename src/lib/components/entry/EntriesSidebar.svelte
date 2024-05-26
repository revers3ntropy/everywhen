<script lang="ts">
    import { page } from '$app/stores';
    import InfiniteScroller from '$lib/components/ui/InfiniteScroller.svelte';
    import { notify } from '$lib/components/notifications/notifications';
    import { ANIMATION_DURATION } from '$lib/constants';
    import { listen } from '$lib/dataChangeEvents';
    import { api } from '$lib/utils/apiRequest';
    import { fmtUtcRelative } from '$lib/utils/time';
    import { onMount } from 'svelte';
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import Close from 'svelte-material-icons/Close.svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import Heart from 'svelte-material-icons/Heart.svelte';
    import Menu from 'svelte-material-icons/Menu.svelte';
    import { Entry, type EntrySummary } from '$lib/controllers/entry/entry';
    import EntrySummaries from './EntrySummaries.svelte';
    import { slide } from 'svelte/transition';

    export let obfuscated = false;
    export let nYearsAgo: Record<string, EntrySummary[]>;
    export let pinnedEntriesSummaries: EntrySummary[];
    export let openOnMobile = false;

    const showLimitPinnedEntries = 10;

    async function loadMoreTitles(): Promise<void> {
        const { summaries: newEntrySummaries, totalCount } = notify.onErr(
            await api.get('/entries/titles', { offset: titleIds.length, count: 10 })
        );
        numTitles = totalCount;
        if (!loadedAny) {
            noEntries = numTitles < 1;
        }

        loadedAny = true;
        summaries = Entry.groupEntriesByDay(newEntrySummaries, summaries);

        titleIds = [...titleIds, ...newEntrySummaries.map(t => t.id)];
    }

    page.subscribe(() => {
        openOnMobile = false;
    });

    $: pinnedEntries = Entry.groupEntriesByDay(
        showingAllPinned
            ? pinnedEntriesSummaries
            : pinnedEntriesSummaries
                  .sort((a, b) => b.created - a.created)
                  .slice(0, showLimitPinnedEntries)
    );
    $: areHiddenPinnedEntries =
        pinnedEntriesSummaries.length > showLimitPinnedEntries && !showingAllPinned;

    listen.entry.onCreate(entry => {
        // if no pinned entries already, face to force the pinned entries to be shown
        if (Entry.isPinned(entry) && !pinnedEntriesSummaries.length) {
            pinnedEntriesSummaries = [Entry.summaryFromEntry(entry)];
        }
        numTitles++;
        titleIds.push(entry.id);
    });
    listen.entry.onUpdate(entry => {
        if (Entry.isPinned(entry) && !pinnedEntriesSummaries.length) {
            pinnedEntriesSummaries = [Entry.summaryFromEntry(entry)];
        }
    });
    listen.entry.onDelete(entryId => {
        numTitles--;
        titleIds = titleIds.filter(id => id !== entryId);
    });

    onMount(() => {
        void loadMoreTitles();
    });

    let loadedAny = false;
    let noEntries = true;
    let showingAllPinned = false;
    let summaries: Record<string, EntrySummary[]> = {};
    let numTitles = 1;
    let titleIds: string[] = [];
</script>

<div class="fixed only-mobile z-10 p-1 top-0">
    <button
        aria-label="Show sidebar menu"
        class="bg-lightAccent rounded-lg"
        on:click={() => (openOnMobile = !openOnMobile)}
    >
        <Menu size="40" />
    </button>
</div>

<div
    class="h-screen z-10 w-full md:w-60 border-borderColor overflow-y-auto fixed top-0 left-0 md:sticky md:z-0 -translate-x-full md:translate-x-0 transition-[300ms] border-l-2"
    class:translate-x-0={openOnMobile}
    class:bg-vLightAccent={openOnMobile || !noEntries}
>
    <div class="p-2 flex justify-end sticky top-0">
        {#if !noEntries}
            <button
                aria-label={obfuscated ? 'Show entries' : 'Hide entries'}
                on:click={() => (obfuscated = !obfuscated)}
            >
                {#if obfuscated}
                    <Eye size="25" />
                {:else}
                    <EyeOff size="25" />
                {/if}
            </button>
        {/if}
        <button
            class="only-mobile"
            aria-label="Close sidebar menu"
            on:click={() => (openOnMobile = !openOnMobile)}
        >
            <Close size="30" />
        </button>
    </div>
    <div>
        {#key [pinnedEntriesSummaries, showingAllPinned]}
            {#if Object.keys(pinnedEntries).length}
                <div class="pb-2">
                    <div
                        class="p-2 border-b-2 border-borderColor"
                        transition:slide={{ duration: ANIMATION_DURATION, axis: 'x' }}
                    >
                        <h3
                            class="gradient-icon flex-center"
                            style="justify-content: flex-start; gap: 8px;"
                        >
                            <Heart size="25" />
                            Favourites
                        </h3>
                        <div>
                            <EntrySummaries
                                titles={pinnedEntries}
                                {obfuscated}
                                onCreateFilter={Entry.isPinned}
                                showOnUpdateAndNotAlreadyShownFilter={Entry.isPinned}
                                hideBlurToggle
                            />
                            {#if areHiddenPinnedEntries}
                                <button
                                    class="text-light"
                                    on:click={() => {
                                        showingAllPinned = !showingAllPinned;
                                    }}
                                >
                                    <ChevronDown />
                                    Show all entries in favourites ({pinnedEntriesSummaries.length -
                                        showLimitPinnedEntries})
                                </button>
                            {/if}
                        </div>
                    </div>
                </div>
            {/if}
        {/key}
        {#if Object.entries(nYearsAgo).length}
            <div class="flex flex-col gap-2">
                {#each Object.entries(nYearsAgo) as [date, entries] (date)}
                    <div class="border-b-2 border-borderColor p-2">
                        <h3>
                            {fmtUtcRelative(new Date(date), 'en-full')} since...
                        </h3>
                        <EntrySummaries
                            titles={{
                                [date]: entries
                            }}
                            {obfuscated}
                            showTimeAgo={false}
                            onCreateFilter={() => false}
                            hideBlurToggle
                        />
                    </div>
                {/each}
            </div>
        {/if}
        {#if !noEntries}
            <div class="p-2 relative">
                <InfiniteScroller
                    loadItems={loadMoreTitles}
                    hasMore={() => titleIds.length < numTitles}
                    margin={500}
                >
                    <EntrySummaries {obfuscated} titles={summaries} hideBlurToggle />
                </InfiniteScroller>
            </div>
        {/if}
    </div>
</div>
