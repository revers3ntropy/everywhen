<script lang="ts">
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import TrayArrowUp from 'svelte-material-icons/TrayArrowUp.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import EntryGroup from '../../lib/components/EntryGroup.svelte';
    import PageCounter from '../../lib/components/PageCounter.svelte';
    import { Entry, type EntryFilter } from '../controllers/entry';
    import type { Auth } from '../controllers/user';
    import { obfuscated } from '../stores';
    import { api } from '../utils/apiRequest';
    import { displayNotifOnErr } from '../utils/notifications';
    import { showPopup } from '../utils/popups';
    import type { PickOptionalAndMutable } from '../utils/types';
    import Spinner from './BookSpinner.svelte';
    import ImportDialog from './dialogs/ImportDialog.svelte';
    import Sidebar from './EntriesSidebar.svelte';

    const { addNotification } = getNotificationsContext();

    export let auth: Auth;

    export let showSidebar = false;
    export let showBin = false;
    export let showImport = false;
    export let showSearch = true;
    export let showLabels = true;
    export let showLocations = true;
    export let pageSize: number;

    interface IOptions extends EntryFilter {
        pageSize?: number;
        page?: number;
    }

    export let options: IOptions = {};

    let entries: Record<number, Entry[]> = {};
    let entryTitles: Record<number, Entry[]> = {};
    let entryCount = 0;
    let page = 0;
    let pages = 0;
    let search = '';

    let loading = true;

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

    export async function reloadEntries(force = false) {
        if (loading && !force) return;
        loading = true;

        const entriesOptions: PickOptionalAndMutable<IOptions, 'search'> = {
            page,
            ...options,
            pageSize
        };
        if (search) {
            entriesOptions.search = search;
        }
        if (!entriesOptions.search) {
            delete entriesOptions.search;
        }

        void api
            .get(auth, `/entries`, entriesOptions)
            .then(res => displayNotifOnErr(addNotification, res))
            .then(res => {
                entries = Entry.groupEntriesByDay(res.entries);
                pages = res.totalPages;
                entryCount = res.totalEntries;

                loading = false;
            });

        const res = displayNotifOnErr(
            addNotification,
            await api.get(auth, '/entries/titles')
        );
        entryTitles = Entry.groupEntriesByDay(res.entries);
    }

    export const reload = () => reloadEntries();

    onMount(async () => {
        await reloadEntries(true);
    });
    $: [page, search, browser ? reloadEntries() : 0];
</script>

<div>
    <div>
        <div class="entries-menu">
            <div>
                {#if showSidebar}
                    <Sidebar titles={entryTitles} {auth} />
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
            <div>
                <PageCounter
                    bind:page
                    pageLength={pageSize}
                    {pages}
                    total={entryCount}
                />
            </div>

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
        {#if loading}
            <Spinner />
        {:else}
            {#each Object.keys(entries).sort((a, b) => parseInt(b) - parseInt(a)) as day}
                <EntryGroup
                    entries={entries[parseInt(day)]}
                    on:updated={() => reloadEntries()}
                    obfuscated={$obfuscated}
                    {showLabels}
                    {showLocations}
                    {auth}
                    day={parseInt(day)}
                />
            {/each}
        {/if}
    </div>
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
