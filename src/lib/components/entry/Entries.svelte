<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { inview } from 'svelte-inview';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import Search from 'svelte-material-icons/Magnify.svelte';
    import type { Location } from '$lib/controllers/location/location';
    import type { EntryFilter } from '$lib/controllers/entry/entry';
    import { encryptionKey, obfuscated } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { encrypt } from '$lib/utils/encryption/encryption.client';
    import { currentTzOffset, fmtUtc, nowUtc } from '$lib/utils/time';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications';
    import type { EntryFormMode } from '$lib/components/entryForm/entryFormMode';
    import { Entry } from '$lib/controllers/entry/entry.client';
    import Spinner from '../BookSpinner.svelte';
    import EntryGroup from '$lib/components/entry/EntryGroup.svelte';
    import Sidebar from './EntriesSidebar.svelte';

    interface IOptions extends EntryFilter {
        readonly count?: number;
        readonly offset?: number;
    }

    export let entryFormMode = null as null | EntryFormMode;

    export let showSidebar = false;
    export let showBin = false;
    export let showSearch = true;
    export let showLabels = true;
    export let showLocations = true;
    export let showEntryForm = false;

    export let numberOfEntries = Infinity;

    export let options: IOptions = {};

    function getEntriesOptions(): IOptions {
        const entriesOptions = {
            ...(options as Mutable<IOptions>),
            offset: currentOffset,
            count: batchSize
        };

        if (!entriesOptions.search) {
            delete entriesOptions.search;
        }

        return Object.freeze(entriesOptions);
    }

    async function loadTitles() {
        const res = displayNotifOnErr(await api.get('/entries/titles'));
        entryTitles = Entry.groupEntriesByDay(res.entries);
    }

    async function reloadEntries(reloadTitles = false) {
        currentOffset = 0;
        loadingAt = null;
        entries = emptyEntries();
        numberOfEntries = Infinity;

        await Promise.all([loadMoreEntries(true), reloadTitles ? loadTitles() : Promise.resolve()]);
    }

    async function loadMoreEntries(isInitialLoad = false) {
        pageEndInView = true;
        let offset = currentOffset;
        if (loadingAt === offset && !isInitialLoad) {
            return;
        }
        loadingAt = offset;

        if (loadingAt >= numberOfEntries) {
            return;
        }

        const entriesOptions = getEntriesOptions();

        const res = displayNotifOnErr(
            await api.get(
                `/entries`,
                entriesOptions as Record<string, number | string | boolean | undefined>
            )
        );

        numberOfEntries = res.totalEntries;

        currentOffset += res.entries.length;
        entries = ensureNoDuplicateEntries(Entry.groupEntriesByDay(res.entries, entries));

        // if still loading at this offset, so another req has not been sent,
        // say we have stopped loading
        if (loadingAt === offset) {
            loadingAt = null;
        }

        if (pageEndInView) {
            void loadMoreEntries();
        }
    }

    function ensureNoDuplicateEntries(entries: Record<string, Entry[]>): Record<string, Entry[]> {
        // Very occasionally, the same entries are loaded twice by accident,
        // so filter out duplicates. TODO make it so they are never loaded twice
        for (const day in entries) {
            entries[day] = entries[day].filter(
                (entry, i, arr) => arr.findIndex(e => e.id === entry.id) === i
            );
        }
        return entries;
    }

    function updateSearch() {
        const searchEncrypted = encrypt(searchInput.value, $encryptionKey);

        options = {
            ...options,
            search: searchEncrypted
        };
    }

    async function loadLocations() {
        locations = displayNotifOnErr(await api.get('/locations')).locations;
    }

    function emptyEntries(): Record<string, Entry[]> {
        return {
            [fmtUtc(nowUtc(), currentTzOffset(), 'YYYY-MM-DD')]: []
        };
    }

    let searchInput: HTMLInputElement;

    const batchSize = 10;
    let pageEndInView = false;
    let entryTitles = null as Record<string, Entry[]> | null;
    let entries = emptyEntries();
    let currentOffset = 0;
    let loadingAt = null as number | null;

    let locations = null as Location[] | null;

    onMount(() => {
        void loadTitles();
        void loadLocations();
    });

    $: if (options.search !== undefined && browser) void reloadEntries();
    $: sortedEntryKeys = Object.keys(entries).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    // make sure that there is always 'today' for the entry form
    $: entries[fmtUtc(nowUtc(), currentTzOffset(), 'YYYY-MM-DD')] ??= [];
</script>

<div class="flex-center">
    <div style="width: 100%; max-width: {showSidebar ? 1400 : 800}px">
        <div class:sidebar-and-entries={showSidebar}>
            {#if showSidebar}
                <div style="margin-top: 85px">
                    <Sidebar titles={entryTitles} obfuscated={$obfuscated} />
                </div>
            {/if}

            <div>
                <div>
                    {#if showBin || showSearch}
                        <div class="entries-menu">
                            <div class="hide-mobile">
                                {#if showBin}
                                    <a class="with-circled-icon" href="/journal/deleted">
                                        <Bin size="30" />
                                        Bin
                                    </a>
                                {/if}
                            </div>

                            <div />

                            <div>
                                {#if showSearch}
                                    <input
                                        bind:this={searchInput}
                                        on:change={updateSearch}
                                        placeholder="Search in entries..."
                                        type="text"
                                    />
                                    <button on:click={updateSearch} aria-label="search">
                                        <Search />
                                    </button>
                                {/if}
                            </div>
                        </div>
                    {/if}
                </div>

                <div class="entries">
                    {#each sortedEntryKeys as day (day)}
                        <EntryGroup
                            entries={entries[day]}
                            obfuscated={$obfuscated}
                            {showLabels}
                            {showLocations}
                            day={new Date(day).getTime() / 1000}
                            {locations}
                            {showEntryForm}
                            {entryFormMode}
                        />
                    {/each}
                    {#if loadingAt !== null && loadingAt < numberOfEntries}
                        <Spinner />
                    {/if}
                </div>
                <div
                    use:inview={{ rootMargin: '200px' }}
                    on:inview_enter={() => loadMoreEntries()}
                    on:inview_leave={() => (pageEndInView = false)}
                />
            </div>
        </div>
    </div>
</div>

<style lang="less">
    @import '../../../styles/variables';
    @import '../../../styles/layout';

    .sidebar-and-entries {
        width: 100%;
        display: grid;

        // bit hacky but I couldn't get it to not overflow otherwise
        grid-template-columns: minmax(0, 3fr) 1fr;
        grid-gap: 1rem;

        & > :first-child {
            order: 1;
        }
        & > :last-child {
            order: -1;
        }

        @media @mobile {
            display: block;
        }
    }

    .entries-menu {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        margin: 2rem 0 0 0;

        @media @not-mobile {
            margin: 2rem 0;
        }

        & > div {
            width: 100%;
            display: flex;
            align-items: center;

            &:first-child {
                justify-content: start;
            }

            &:nth-child(2) {
                justify-content: center;
            }

            &:last-child {
                justify-content: end;
            }
        }

        a.primary {
            margin: 0 1em;
        }

        @media @mobile {
            display: block;
            margin: 0;

            & > div {
                margin: 1em 0;
                justify-content: center !important;

                &:first-child {
                    justify-content: space-around !important;
                }
            }
        }
    }
</style>
