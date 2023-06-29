<script lang="ts">
    import { onMount } from 'svelte';
    import Cog from 'svelte-material-icons/Cog.svelte';
    import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
    import LabelOutline from 'svelte-material-icons/LabelOutline.svelte';
    import Notebook from 'svelte-material-icons/Notebook.svelte';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import Heart from 'svelte-material-icons/Heart.svelte';
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import History from 'svelte-material-icons/History.svelte';
    import Calendar from 'svelte-material-icons/Calendar.svelte';
    import { Entry } from '$lib/controllers/entry';
    import { obfuscated } from '$lib/stores.js';
    import { dayUtcFromTimestamp, fmtUtc } from '$lib/utils/time';
    import type { PageData } from './$types';
    import EntryTitles from '$lib/components/entry/EntryTitles.svelte';

    export let data: PageData;

    const showLimitPinnedEntries = 10;
    let showingAllPinned = false;

    onMount(() => {
        document.title = `Home`;
    });

    $: pinnedEntries = Entry.groupEntriesByDay(
        showingAllPinned
            ? data.pinnedEntriesList
            : data.pinnedEntriesList
                  .sort((a, b) => b.created - a.created)
                  .slice(0, showLimitPinnedEntries)
    );
    $: areHiddenPinnedEntries =
        data.pinnedEntriesList.length > showLimitPinnedEntries && !showingAllPinned;
</script>

<main>
    <section>
        <div class="buttons">
            <a class="primary with-icon" href="/journal">
                <Notebook size="25" />
                Journal
            </a>
            <a class="icon-gradient-on-hover with-icon" href="/journal/deleted">
                <Bin size="25" />
                Bin
            </a>
            <a class="icon-gradient-on-hover with-icon" href="/labels">
                <LabelOutline size="25" />
                Labels
            </a>
            <a class="icon-gradient-on-hover with-icon" href="/events">
                <Calendar size="25" />
                Events
            </a>
            <a class="icon-gradient-on-hover with-icon" href="/assets">
                <ImageOutline size="25" />
                Gallery
            </a>
            <a class="icon-gradient-on-hover with-icon" href="/settings">
                <Cog size="25" />
                Settings
            </a>
        </div>
    </section>

    <div style="width: 100%; max-width: 800px;">
        {#if Object.keys(data.recentTitles).length}
            <section>
                <h1 class="flex-center" style="justify-content: start; gap: 8px;">
                    <History size="25" />
                    Recent Entries
                </h1>
                <EntryTitles
                    auth={data.auth}
                    titles={data.recentTitles}
                    obfuscated={$obfuscated}
                    hideAgentWidget={!data.settings.showAgentWidgetOnEntries.value}
                />
            </section>
        {:else}
            <section>
                <h1 class="recent-entries"> Recent Entries </h1>
                <p class="recent-entries-text">
                    Doesn't look like you have any entries yet, why not <a
                        href="/journal?obfuscate=0"
                    >
                        write one</a
                    >?
                </p>
            </section>
        {/if}
        {#key [data.pinnedEntriesList, showingAllPinned]}
            {#if Object.keys(pinnedEntries).length}
                <section>
                    <h1 class="gradient-icon flex-center" style="justify-content: start; gap: 8px;">
                        <Heart size="25" />
                        Favourited Entries
                    </h1>
                    <EntryTitles
                        auth={data.auth}
                        titles={pinnedEntries}
                        obfuscated={$obfuscated}
                        hideAgentWidget={!data.settings.showAgentWidgetOnEntries.value}
                    />
                    {#if areHiddenPinnedEntries}
                        <button
                            class="text-light"
                            on:click={() => {
                                showingAllPinned = !showingAllPinned;
                            }}
                        >
                            <ChevronDown />
                            Show all favourited entries ({data.pinnedEntriesList.length -
                                showLimitPinnedEntries})
                        </button>
                    {/if}
                </section>
            {/if}
        {/key}
        {#each Object.entries(data.nYearsAgo) as [yearsAgo, entries] (yearsAgo)}
            <section>
                <h1>
                    {yearsAgo === '1' ? `A Year` : `${yearsAgo} Years`} Ago Today
                </h1>
                <EntryTitles
                    titles={{
                        [fmtUtc(
                            dayUtcFromTimestamp(entries[0].created, entries[0].createdTZOffset),
                            0,
                            'YYYY-MM-DD'
                        )]: entries
                    }}
                    obfuscated={$obfuscated}
                    showTimeAgo={false}
                    auth={data.auth}
                    hideAgentWidget={!data.settings.showAgentWidgetOnEntries.value}
                />
            </section>
        {/each}
    </div>
</main>

<style lang="less">
    @import '../../../styles/variables';
    @import '../../../styles/layout';

    .buttons {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        margin: 1rem;

        @media @mobile {
            margin: 0;
            flex-direction: column;
        }

        a,
        button {
            padding: 0.5rem;
            margin: 0.2rem 1rem;
            font-size: 1.1rem;
        }
    }

    h1 {
        font-size: 1.5rem;
        // negative on the bottom to put in line with the titles due
        // to the visibility toggle being inline
        margin: 1em 1em -22px 1em;
        padding: 0.5em;
        border-bottom: 1px solid var(--border-color);
        text-align: start;

        @media @mobile {
            font-size: 1.2rem;
        }

        &.recent-entries {
            margin: 1rem;
        }
    }

    .recent-entries-text {
        margin: 0.5rem;
    }
</style>
