<script lang="ts">
    import BulletEntriesForm from '$lib/components/entryForm/BulletEntriesForm.svelte';
    import Tips from '$lib/components/Tips.svelte';
    import { listen } from '$lib/dataChangeEvents';
    import Cog from 'svelte-material-icons/Cog.svelte';
    import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
    import LabelOutline from 'svelte-material-icons/LabelOutline.svelte';
    import Notebook from 'svelte-material-icons/Notebook.svelte';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import Heart from 'svelte-material-icons/Heart.svelte';
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import Calendar from 'svelte-material-icons/Calendar.svelte';
    import { Entry } from '$lib/controllers/entry/entry.client';
    import { obfuscated } from '$lib/stores.js';
    import { dayUtcFromTimestamp, fmtUtc } from '$lib/utils/time';
    import type { PageData } from './$types';
    import EntryTitles from '$lib/components/entry/EntryTitles.svelte';

    export let data: PageData;

    const showLimitPinnedEntries = 10;
    let showingAllPinned = false;

    $: pinnedEntries = Entry.groupEntriesByDay(
        showingAllPinned
            ? data.pinnedEntriesList
            : data.pinnedEntriesList
                  .sort((a, b) => b.created - a.created)
                  .slice(0, showLimitPinnedEntries)
    );
    $: areHiddenPinnedEntries =
        data.pinnedEntriesList.length > showLimitPinnedEntries && !showingAllPinned;

    listen.entry.onCreate(({ entry }) => {
        // if no recent entries,
        // create a new group with the new entry
        if (Object.keys(data.recentTitles).length < 1) {
            data = {
                ...data,
                recentTitles: Entry.groupEntriesByDay([entry])
            };
        }
    });
</script>

<svelte:head>
    <title>Home</title>
</svelte:head>

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

    <section>
        <Tips />
    </section>

    <section>
        <div class="container">
            <BulletEntriesForm
                auth={data.auth}
                obfuscated={$obfuscated}
                showLocationToggle={false}
                submitIsPrimaryButton={false}
                setEntryFormMode={null}
            />
            <div style="margin: 1rem">
                {#if Object.keys(data.recentTitles).length}
                    <EntryTitles
                        auth={data.auth}
                        titles={data.recentTitles}
                        obfuscated={$obfuscated}
                        hideAgentWidget={!data.settings.showAgentWidgetOnEntries.value}
                        hideBlurToggle
                    />
                {:else}
                    <p class="text-light"> No recent entries </p>
                {/if}
            </div>
        </div>
    </section>

    <div>
        {#key [data.pinnedEntriesList, showingAllPinned]}
            {#if Object.keys(pinnedEntries).length}
                <section>
                    <div class="container">
                        <h1
                            class="gradient-icon flex-center"
                            style="justify-content: start; gap: 8px;"
                        >
                            <Heart size="25" />
                            Favourited
                        </h1>
                        <div style="margin: 1rem">
                            <EntryTitles
                                auth={data.auth}
                                titles={pinnedEntries}
                                obfuscated={$obfuscated}
                                hideAgentWidget={!data.settings.showAgentWidgetOnEntries.value}
                                onCreateFilter={Entry.isPinned}
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
                                    Show all favourited entries ({data.pinnedEntriesList.length -
                                        showLimitPinnedEntries})
                                </button>
                            {/if}
                        </div>
                    </div>
                </section>
            {/if}
        {/key}
        <section>
            <div class="container">
                {#each Object.entries(data.nYearsAgo) as [yearsAgo, entries] (yearsAgo)}
                    <h1>
                        {yearsAgo === '1' ? `A Year` : `${yearsAgo} Years`} Ago Today
                    </h1>
                    <div style="margin: 1rem">
                        <EntryTitles
                            titles={{
                                [fmtUtc(
                                    dayUtcFromTimestamp(
                                        entries[0].created,
                                        entries[0].createdTZOffset
                                    ),
                                    0,
                                    'YYYY-MM-DD'
                                )]: entries
                            }}
                            obfuscated={$obfuscated}
                            showTimeAgo={false}
                            auth={data.auth}
                            hideAgentWidget={!data.settings.showAgentWidgetOnEntries.value}
                            onCreateFilter={() => false}
                            hideBlurToggle
                        />
                    </div>
                {/each}
            </div>
        </section>
    </div>
</main>

<style lang="less">
    @import '../../../styles/variables';
    @import '../../../styles/layout';

    section {
        max-width: 800px;
    }

    .buttons {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        margin: 1rem 0;

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
        font-size: 1.3rem;
        margin: 1rem;
        padding: 0.5em;
        text-align: start;

        @media @mobile {
            font-size: 1.2rem;
        }

        &.recent-entries {
            margin: 1rem;
        }
    }
</style>
