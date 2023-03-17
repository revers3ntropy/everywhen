<script lang="ts">
    import { browser } from '$app/environment';
    import moment from 'moment';
    import { onMount } from 'svelte';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import TrayArrowUp from 'svelte-material-icons/TrayArrowUp.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import Time from 'svelte-time';
    import EntryGroup from '../../lib/components/EntryGroup.svelte';
    import PageCounter from '../../lib/components/PageCounter.svelte';
    import Sidebar from '../../routes/diary/Sidebar.svelte';
    import { api } from '../api/apiQuery';
    import { obfuscated } from '../constants';
    import { Entry } from '../controllers/entry';
    import type { Auth } from '../controllers/user';
    import { displayNotifOnErr, nowS, showPopup } from '../utils';
    import Spinner from './BookSpinner.svelte';
    import ImportDialog from './dialogs/ImportDialog.svelte';

    const { addNotification } = getNotificationsContext();

    export let auth: Auth;

    export let showSidebar = false;
    export let showBin = false;
    export let showImport = false;
    export let showSearch = true;
    export let showLabels = true;

    const PAGE_LENGTH = 100;

    interface IOptions {
        pageSize?: number;
        page?: number;
        search?: string;
        labelId?: string;
        deleted?: boolean;
    }

    export let options: IOptions = {};

    let entries: Record<number, Entry[]> = {};
    let entryTitles: Record<number, Entry[]> = {};
    let entryCount = 0;
    let page = 0;
    let pages = 0;
    let search = '';
    let loading = true;

    function importPopup () {
        showPopup(ImportDialog, {
            auth,
            type: 'entries',
        }, reloadEntries);
    }

    export async function reloadEntries () {
        loading = true;

        const entriesOptions: IOptions = {
            page,
            ...options,
            pageSize: PAGE_LENGTH,
        };
        if (search) {
            entriesOptions.search = search;
        }

        api.get(auth, `/entries`, entriesOptions)
           .then(res => displayNotifOnErr(addNotification, res))
           .then(res => {
               entries = Entry.groupEntriesByDay(res.entries);
               pages = res.totalPages;
               entryCount = res.totalEntries;

               loading = false;
           });

        const res = displayNotifOnErr(addNotification,
            await api.get(auth, '/entries/titles'),
        );
        entryTitles = Entry.groupEntriesByDay(res.entries);
    }

    export const reload = () => reloadEntries();

    onMount(() => {
        reloadEntries();
    });
    $: [ page, search, browser ? reloadEntries() : 0 ];
</script>

<div>
    <div>
        <div class="entries-menu">
            <div>
                {#if showSidebar}
                    <Sidebar titles={entryTitles} />
                {/if}
                {#if showBin}
                    <a class="primary" href="/deleted">
                        <Bin size="30" />
                        Bin
                    </a>
                {/if}
                {#if showImport}
                    <button class="primary" on:click={importPopup}>
                        <TrayArrowUp size="30" />
                        Import
                    </button>
                {/if}
            </div>
            <div>
                <PageCounter
                    bind:page
                    pageLength={PAGE_LENGTH}
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
    <div>
        {#if loading}
            <Spinner />
        {:else}
            {#each Object.keys(entries)
                .sort((a, b) => parseInt(b) - parseInt(a)) as day}
                <EntryGroup
                    entries={entries[parseInt(day)]}
                    on:updated={() => reloadEntries()}
                    obfuscated={$obfuscated}
                    {showLabels}
                    {auth}
                >
                    <div slot="title" class="entry-group-title">
                        <h2>
                            {moment(new Date(parseInt(day) * 1000))
                                .format('dddd, Do MMMM YYYY')}
                        </h2>
                        <span class="text-light">
                            {#if nowS() - parseInt(day) < 8.64e4}
                                <span>Today</span>
                            {:else if nowS() - parseInt(day) < 1.728e5}
                                <span>Yesterday</span>
                            {:else}
                                <Time
                                    relative
                                    timestamp={new Date(
                                        parseInt(day) * 1000 + (
                                            60 * 60 * 23 + 60 * 60 + 59
                                        ) * 1000
                                    )}
                                />
                            {/if}
                        </span>
                    </div>
                </EntryGroup>
            {/each}
        {/if}
    </div>
</div>

<style lang="less">
    @import '../../styles/variables.less';

    .entry-group-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .entries-menu {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 30px;

        div {
            display: flex;
            align-items: center;
            justify-items: center;
        }

        a.primary {
            margin: 0 1em;
        }

        @media @mobile {
            flex-direction: column;
            margin: 0;

            div {
                margin: 0.5em 0;
            }
        }
    }
</style>
