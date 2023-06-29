<script lang="ts">
    import { browser } from '$app/environment';
    import { EntryFormMode } from '$lib/components/entryForm/entryFormMode';
    import { listen } from '$lib/dataChangeEvents';
    import { encrypt } from '$lib/security/encryption.js';
    import { currentTzOffset, fmtUtc, nowUtc } from '$lib/utils/time';
    import { onMount } from 'svelte';
    import { inview } from 'svelte-inview';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import Search from 'svelte-material-icons/Magnify.svelte';
    import EntryGroup from '$lib/components/entry/EntryGroup.svelte';
    import { Entry, type EntryFilter } from '$lib/controllers/entry';
    import type { Auth } from '$lib/controllers/user';
    import { obfuscated } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications';
    import Spinner from '../BookSpinner.svelte';
    import Sidebar from './EntriesSidebar.svelte';
    import type { Location } from '$lib/controllers/location';

    interface IOptions extends EntryFilter {
        readonly count?: number;
        readonly offset?: number;
    }

    export let auth: Auth;

    export let entryFormMode = null as null | EntryFormMode;

    export let showSidebar = false;
    export let showBin = false;
    export let showSearch = true;
    export let showLabels = true;
    export let showLocations = true;
    export let showEntryForm = false;
    export let hideAgentWidget: boolean;

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
        const res = displayNotifOnErr(await api.get(auth, '/entries/titles'));
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
                auth,
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
        const searchEncrypted = displayNotifOnErr(encrypt(searchInput.value, auth.key));

        options = {
            ...options,
            search: searchEncrypted
        };
    }

    function scrollToEntry(id: string) {
        setTimeout(() => {
            const el = document.getElementById(id);
            if (!el) {
                console.error('Could not find new entry element');
                return;
            }
            el.tabIndex = -1;
            el.focus({ preventScroll: false });
        }, 10);
    }

    async function loadLocations() {
        locations = displayNotifOnErr(await api.get(auth, '/locations')).locations;
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

    listen.entry.onCreate(({ entry, entryMode }: { entry: Entry; entryMode: EntryFormMode }) => {
        const localDate = fmtUtc(entry.created, entry.createdTZOffset, 'YYYY-MM-DD');
        entries[localDate] = [entry, ...(entries?.[localDate] || [])];
        entries = { ...entries };

        if (entryMode === EntryFormMode.Standard) {
            scrollToEntry(entry.id);
        }
    });
    listen.entry.onDelete(id => {
        for (const day in entries) {
            entries[day] = entries[day].filter(entry => entry.id !== id);
        }
    });
    listen.entry.onUpdate(entry => {
        for (const day in entries) {
            const i = entries[day].findIndex(e => e.id === entry.id);
            if (i !== -1) {
                entries[day][i] = entry;
            }
        }
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
        <div>
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
                            placeholder="Search..."
                            type="text"
                        />
                        <button on:click={updateSearch} aria-label="search">
                            <Search />
                        </button>
                    {/if}
                </div>
            </div>
        </div>
        <div class:sidebar-and-entries={showSidebar}>
            {#if showSidebar}
                <div>
                    <Sidebar
                        titles={entryTitles}
                        {auth}
                        {hideAgentWidget}
                        obfuscated={$obfuscated}
                    />
                </div>
            {/if}

            <div>
                <div class="entries">
                    {#each sortedEntryKeys as day (entries[day])}
                        <EntryGroup
                            entries={entries[day]}
                            obfuscated={$obfuscated}
                            {showLabels}
                            {showLocations}
                            {auth}
                            day={new Date(day).getTime() / 1000}
                            {hideAgentWidget}
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
