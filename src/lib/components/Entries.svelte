<script lang="ts">
    import { browser } from '$app/environment';
    import { encrypt } from '$lib/security/encryption.js';
    import { onMount } from 'svelte';
    import { inview } from 'svelte-inview';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import TrayArrowUp from 'svelte-material-icons/TrayArrowUp.svelte';
    import EntryGroup from '$lib/components/EntryGroup.svelte';
    import type { Mutable } from '../../app';
    import { Entry, type EntryFilter } from '../controllers/entry';
    import type { Auth } from '../controllers/user';
    import { obfuscated } from '../stores';
    import { api } from '../utils/apiRequest';
    import { displayNotifOnErr } from '../notifications/notifications';
    import { showPopup } from '../utils/popups';
    import Spinner from './BookSpinner.svelte';
    import ImportDialog from '$lib/dialogs/ImportDialog.svelte';
    import Sidebar from './EntriesSidebar.svelte';

    export let auth: Auth;

    export let showSidebar = false;
    export let showBin = false;
    export let showImport = false;
    export let showSearch = true;
    export let showLabels = true;
    export let showLocations = true;
    export let hideAgentWidget: boolean;

    interface IOptions extends EntryFilter {
        readonly count?: number;
        readonly offset?: number;
    }

    export let options: IOptions = {};

    const batchSize = 10;

    let search = null as null | string;
    let entryTitles: Record<string, Entry[]> = {};
    let entries: Record<string, Entry[]> = {};
    let currentOffset = 0;
    let loadingAt = null as number | null;
    export let numberOfEntries = Infinity;

    function importPopup() {
        showPopup(
            ImportDialog,
            {
                auth,
                type: 'entries'
            },
            reloadEntries
        );
    }

    function getEntriesOptions(): IOptions {
        const entriesOptions = {
            ...(options as Mutable<IOptions>),
            offset: currentOffset,
            count: batchSize
        };

        if (search) {
            entriesOptions.search = displayNotifOnErr(
                encrypt(search, auth.key)
            );
        }

        if (!entriesOptions.search) {
            delete entriesOptions.search;
        }

        return Object.freeze(entriesOptions);
    }

    async function loadTitles() {
        const res = displayNotifOnErr(await api.get(auth, '/entries/titles'));
        entryTitles = Entry.groupEntriesByDay(res.entries);
    }

    async function reloadEntries() {
        currentOffset = 0;
        loadingAt = null;
        entries = {};

        await Promise.all([loadMoreEntries(true), loadTitles()]);
    }

    async function loadMoreEntries(isInitialLoad = false) {
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
                entriesOptions as Record<
                    string,
                    number | string | boolean | undefined
                >
            )
        );

        numberOfEntries = res.totalEntries;

        currentOffset += res.entries.length;
        entries = Entry.groupEntriesByDay(res.entries, entries);

        // if still loading at this offset,
        // so another req has not been sent,
        // say we have stopped loading
        if (loadingAt === offset) {
            loadingAt = null;
        }
    }

    export const reload = () => reloadEntries();

    onMount(async () => {
        await loadTitles();
    });

    $: if (search !== null && browser) void reloadEntries();
</script>

<div>
    <div>
        <div class="entries-menu">
            <div>
                {#if showSidebar}
                    <Sidebar titles={entryTitles} {auth} {hideAgentWidget} />
                {/if}
                {#if showBin}
                    <a class="with-circled-icon" href="/journal/deleted">
                        <Bin size="30" />
                        Bin
                    </a>
                {/if}
                {#if showImport}
                    <button
                        class="with-circled-icon hide-mobile"
                        on:click={importPopup}
                    >
                        <TrayArrowUp size="30" />
                        Import
                    </button>
                {/if}
            </div>

            <div />

            <div>
                {#if showSearch}
                    <input
                        bind:value={search}
                        placeholder="Search..."
                        type="text"
                    />
                {/if}
            </div>
        </div>
    </div>
    <div class="entries">
        {#each Object.keys(entries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) as day}
            <EntryGroup
                entries={entries[day]}
                on:updated={() => reloadEntries()}
                obfuscated={$obfuscated}
                {showLabels}
                {showLocations}
                {auth}
                day={new Date(day).getTime() / 1000}
                {hideAgentWidget}
            />
        {/each}
        {#if loadingAt !== null && loadingAt < numberOfEntries}
            <Spinner />
        {/if}
    </div>
    <div
        use:inview={{ rootMargin: '100px' }}
        on:inview_enter={() => loadMoreEntries()}
    />
</div>

<style lang="less">
    @import '../../styles/variables';
    @import '../../styles/layout';

    .entries-menu {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        margin: 3rem 0 0 0;

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
