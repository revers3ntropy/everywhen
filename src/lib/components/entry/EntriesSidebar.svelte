<script lang="ts">
    import InfiniteScroller from '$lib/components/InfiniteScroller.svelte';
    import { notify } from '$lib/components/notifications/notifications';
    import { listen } from '$lib/dataChangeEvents';
    import { api } from '$lib/utils/apiRequest';
    import { fmtUtcRelative } from '$lib/utils/time';
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import Close from 'svelte-material-icons/Close.svelte';
    import Eye from 'svelte-material-icons/Eye.svelte';
    import EyeOff from 'svelte-material-icons/EyeOff.svelte';
    import Heart from 'svelte-material-icons/Heart.svelte';
    import Menu from 'svelte-material-icons/Menu.svelte';
    import { Entry, type EntrySummary } from '$lib/controllers/entry/entry';
    import EntrySummaries from './EntrySummaries.svelte';

    export let obfuscated = false;
    export let nYearsAgo: Record<string, EntrySummary[]>;
    export let pinnedEntriesSummaries: EntrySummary[];

    const showLimitPinnedEntries = 10;

    async function loadMoreTitles(offset: number, count: number): Promise<string[]> {
        const { summaries: newEntrySummaries, totalCount } = notify.onErr(
            await api.get('/entries/titles', { offset, count })
        );
        numTitles = totalCount;

        summaries = Entry.groupEntriesByDay(newEntrySummaries, summaries);

        return newEntrySummaries.map(t => t.id);
    }

    $: pinnedEntries = Entry.groupEntriesByDay(
        showingAllPinned
            ? pinnedEntriesSummaries
            : pinnedEntriesSummaries
                  .sort((a, b) => b.created - a.created)
                  .slice(0, showLimitPinnedEntries)
    );
    $: areHiddenPinnedEntries =
        pinnedEntriesSummaries.length > showLimitPinnedEntries && !showingAllPinned;

    listen.entry.onCreate(({ entry }) => {
        // if no pinned entries already, face to force the pinned entries to be shown
        if (Entry.isPinned(entry) && !pinnedEntriesSummaries.length) {
            pinnedEntriesSummaries = [Entry.summaryFromEntry(entry)];
        }
    });
    listen.entry.onUpdate(entry => {
        if (Entry.isPinned(entry) && !pinnedEntriesSummaries.length) {
            pinnedEntriesSummaries = [Entry.summaryFromEntry(entry)];
        }
    });

    let showingAllPinned = false;
    let showing = false;
    let summaries = {} as Record<string, EntrySummary[]>;
    let numTitles = -1;
    let titleIds: string[] = [];
</script>

<div class="floating-button only-mobile">
    <button aria-label="Show sidebar menu" on:click={() => (showing = !showing)}>
        <Menu size="40" />
    </button>
</div>
<div class="sidebar {showing ? 'showing' : ''}">
    <div class="header">
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
        <button
            class="only-mobile"
            aria-label="Close sidebar menu"
            on:click={() => (showing = !showing)}
        >
            <Close size="30" />
        </button>
    </div>
    <div>
        {#key [pinnedEntriesSummaries, showingAllPinned]}
            {#if Object.keys(pinnedEntries).length}
                <section class="container" style="padding: 1rem">
                    <h3 class="gradient-icon flex-center" style="justify-content: start; gap: 8px;">
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
                </section>
            {/if}
        {/key}
        {#if Object.entries(nYearsAgo).length}
            <section class="container" style="padding: 1rem">
                {#each Object.entries(nYearsAgo) as [date, entries] (date)}
                    <h3>
                        <!-- bit of a hack... -->
                        {fmtUtcRelative(entries[0].created, 'en-full')} since...
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
                {/each}
            </section>
        {/if}
        <InfiniteScroller
            bind:items={titleIds}
            batchSize={100}
            numItems={numTitles}
            loadItems={loadMoreTitles}
            margin="500px"
        >
            <EntrySummaries {obfuscated} titles={summaries} hideBlurToggle />
        </InfiniteScroller>
    </div>
</div>

<style lang="less">
    @import '../../../styles/variables';

    .sidebar {
        width: 100%;
        overflow-y: auto;
        padding: 0 0 0 0.5rem;

        @media @not-mobile {
            position: sticky;
            top: 1rem;
            height: calc(100vh - 2rem);
            // for the scroll bar
            border-radius: 0;
            background: none;
        }

        @media @mobile {
            background: var(--v-light-accent);
            height: 100vh;
            z-index: 10;
            transition: @transition;
            transform: translateX(-100%);
            position: fixed;
            top: 0;
            left: 0;
            margin: 0;

            &.showing {
                transform: translateX(0);
                border-right: 2px solid var(--border-heavy);
            }
        }

        .header {
            padding: 0.5rem;
            display: flex;
            justify-content: right;
            align-content: center;
            position: sticky;
            top: 0;
        }
    }
</style>
