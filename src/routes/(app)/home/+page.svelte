<script lang="ts">
    import BulletEntriesForm from '$lib/components/entryForm/BulletEntriesForm.svelte';
    import Tips from '$lib/components/Tips.svelte';
    import { listen } from '$lib/dataChangeEvents';
    import { fmtUtcRelative } from '$lib/utils/time';
    import Cog from 'svelte-material-icons/Cog.svelte';
    import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
    import LabelOutline from 'svelte-material-icons/LabelOutline.svelte';
    import Notebook from 'svelte-material-icons/Notebook.svelte';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import Heart from 'svelte-material-icons/Heart.svelte';
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import Calendar from 'svelte-material-icons/Calendar.svelte';
    import { Entry } from '$lib/controllers/entry/entry';
    import { obfuscated } from '$lib/stores';
    import type { PageData } from './$types';
    import EntryTitles from '$lib/components/entry/EntryTitles.svelte';
    import DatasetShortcutWidgets from '$lib/components/dataset/DatasetShortcutWidgets.svelte';

    export let data: PageData;

    let { recentTitles, pinnedEntriesList, datasets, nYearsAgo } = data;

    const showLimitPinnedEntries = 10;
    let showingAllPinned = false;

    $: pinnedEntries = Entry.groupEntriesByDay(
        showingAllPinned
            ? pinnedEntriesList
            : pinnedEntriesList
                  .sort((a, b) => b.created - a.created)
                  .slice(0, showLimitPinnedEntries)
    );
    $: areHiddenPinnedEntries =
        pinnedEntriesList.length > showLimitPinnedEntries && !showingAllPinned;

    listen.entry.onCreate(({ entry }) => {
        // if no recent entries,
        // create a new group with the new entry
        if (Object.keys(recentTitles).length < 1) {
            recentTitles = Entry.groupEntriesByDay([entry]);
        }

        // if no pinned entries already, face to force the pinned entries to be shown
        if (Entry.isPinned(entry) && !pinnedEntriesList.length) {
            pinnedEntriesList = [entry];
        }
    });
    listen.entry.onUpdate(entry => {
        if (Entry.isPinned(entry) && !pinnedEntriesList.length) {
            pinnedEntriesList = [entry];
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
        <DatasetShortcutWidgets {datasets} />
    </section>

    <section class="container" style="padding: 1rem">
        <Tips />
    </section>

    <section class="container">
        <BulletEntriesForm
            obfuscated={$obfuscated}
            showLocationToggle={false}
            submitIsPrimaryButton={false}
            setEntryFormMode={null}
        />
        <div style="margin: 1rem">
            {#if Object.keys(recentTitles).length}
                <EntryTitles titles={recentTitles} obfuscated={$obfuscated} hideBlurToggle />
            {:else}
                <p class="text-light"> No recent entries </p>
            {/if}
        </div>
    </section>

    <div>
        {#key [pinnedEntriesList, showingAllPinned]}
            {#if Object.keys(pinnedEntries).length}
                <section class="container" style="padding: 1rem">
                    <h1 class="gradient-icon flex-center" style="justify-content: start; gap: 8px;">
                        <Heart size="25" />
                        Favourited
                    </h1>
                    <div>
                        <EntryTitles
                            titles={pinnedEntries}
                            obfuscated={$obfuscated}
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
                                Show all favourited entries ({pinnedEntriesList.length -
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
                    <h1>
                        <!-- bit of a hack... -->
                        {fmtUtcRelative(entries[0].created, 'en-full')} since...
                    </h1>
                    <EntryTitles
                        titles={{
                            [date]: entries
                        }}
                        obfuscated={$obfuscated}
                        showTimeAgo={false}
                        onCreateFilter={() => false}
                        hideBlurToggle
                    />
                {/each}
            </section>
        {/if}
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
        margin: 1rem 1rem;
        gap: 1rem;

        @media @mobile {
            margin: 1rem 0;
            flex-direction: column;
            gap: 0.2rem;
        }

        a,
        button {
            padding: 0.5rem;
            font-size: 1.1rem;

            &.icon-gradient-on-hover.with-icon {
                background: var(--v-light-accent);
                border-radius: @border-radius;
                padding: 0.4em 0.8em 0.4em 0.4em;

                &:hover {
                    background: var(--light-accent);
                }
            }
        }
    }

    h1 {
        font-size: 1.3rem;
        text-align: start;
        padding: 1.5rem 0 1rem 0.5rem;

        @media @mobile {
            font-size: 1.2rem;
        }
    }
</style>
