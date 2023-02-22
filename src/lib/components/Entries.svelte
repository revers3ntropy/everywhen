<script lang="ts">
    import moment from "moment";
    import Time from "svelte-time";
    import { getNotificationsContext } from "svelte-notifications";
    import Bin from "svelte-material-icons/Delete.svelte";
    import TrayArrowUp from "svelte-material-icons/TrayArrowUp.svelte";
    import Spinner from "../../lib/components/Spinner.svelte";
    import { obfuscated } from "../constants";
    import EntryGroup from "../../lib/components/EntryGroup.svelte";
    import Sidebar from "../../routes/diary/Sidebar.svelte";
    import PageCounter from "../../lib/components/PageCounter.svelte";
    import type { Entry as EntryType } from "../../lib/types";
    import { showPopup } from "../utils";
    import { api } from "../api/apiQuery";
    import { groupEntriesByDay } from "../../routes/api/entries/utils.client";
    import ImportDialog from "./dialogs/ImportDialog.svelte";

    const { addNotification } = getNotificationsContext();

    export let auth;

    export let showSidebar = false;
    export let showBin = false;
    export let showImport = false;
    export let showSearch = true;
    export let showLabels = true;

    export let options = {};

    let entries: Record<number, EntryType[]> = {};

    let entryTitles: Record<number, EntryType[]> = {};
    let entryCount = 0;

    const PAGE_LENGTH = 3000;
    let page = 0;
    let pages = 0;

    let search = "";

    let loading = true;

    function importPopup () {
        showPopup(ImportDialog, { auth }, () => reload(page, search));
    }

    export async function reload (page: number, search: string) {
        loading = true;

        const entriesOptions = {
            page,
            ...options,
            pageSize: PAGE_LENGTH
        };
        if (search) {
            entriesOptions["search"] = search;
        }

        api.get(auth, `/entries`, entriesOptions)
            .then((res) => {
                if (
                    !res.entries ||
                    res.totalPages === undefined ||
                    res.totalEntries === undefined
                ) {
                    console.error(res);
                    addNotification({
                        text: `Cannot load entries: ${ res.body?.message }`,
                        position: "top-center",
                        type: "error",
                        removeAfter: 4000
                    });
                    return;
                }
                entries = groupEntriesByDay(res.entries);
                pages = res.totalPages;
                entryCount = res.totalEntries;

                loading = false;
            });

        const res = await api.get(auth, "/entries/titles");
        if (!res.entries) {
            console.error(res);
            addNotification({
                text: `Cannot load entries: ${ res.body?.message }`,
                position: "top-center",
                type: "error",
                removeAfter: 4000
            });
            return;
        }
        entryTitles = groupEntriesByDay(res.entries);
    }

    $: reload(page, search);
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
            {#each Object.keys(entries).sort((a, b) => b - a) as day}
                <EntryGroup
                    entries={entries[day]}
                    on:updated={() => reload(page, search)}
                    obfuscated={$obfuscated}
                    {showLabels}
                >
                    <div slot="title" class="entry-group-title">
                        <h2>{moment(new Date(day * 1000)).format('dddd, Do MMMM YYYY')}</h2>
                        <span class="text-light">
                            {#if new Date() - new Date(day * 1000) < 8.64e7}
                                <span>Today</span>
                            {:else if new Date() - new Date(day * 1000) < 1.728e8}
                                <span>Yesterday</span>
                            {:else}
                                <Time
                                    relative
                                    timestamp={new Date(
                                        day * 1000 + (60 * 60 * 23 + 60 * 60 + 59) * 1000
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
