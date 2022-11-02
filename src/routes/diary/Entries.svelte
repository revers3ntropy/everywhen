<script lang="ts">
    import { obfuscated } from "$lib/constants.js";
    import EntryGroup from '$lib/components/EntryGroup.svelte';
    import moment from 'moment';
    import Bin from 'svelte-material-icons/Delete.svelte';
    import TrayArrowUp from 'svelte-material-icons/TrayArrowUp.svelte';
    import Sidebar from './Sidebar.svelte';
    import PageCounter from '$lib/components/PageCounter.svelte';
    import Time from 'svelte-time';
    import type { Entry as EntryType } from "$lib/types";
    import { GETArgs, showPopup } from "$lib/utils";
    import ImportDialog from "./ImportDialog.svelte";
    import { createEventDispatcher } from "svelte";
    import { api } from "$lib/api/apiQuery";
    import { groupEntriesByDay } from "../api/entries/utils.client";
    import { getNotificationsContext } from "svelte-notifications";

    const { addNotification } = getNotificationsContext();
    const dispatch = createEventDispatcher();

    export let auth;

    let entries: Record<number, EntryType[]> = {};
    let entryTitles: Record<number, EntryType[]> = {};
    let entryCount = 0;

    const PAGE_LENGTH = 3000;
    let page = 0;
    let pages = 0;

    let search = '';

    function importPopup () {
        showPopup(ImportDialog, { auth }, () => dispatch('updated'));
    }

    export async function reload(page: number, search: string) {
        const entriesOptions = {
            page,
            pageSize: PAGE_LENGTH
        };
        if (search) {
            entriesOptions['search'] = search;
        }

        api.get(auth, `/entries?${GETArgs(entriesOptions)}`)
            .then((res) => {
                if (
                    !res.entries ||
                    res.totalPages === undefined ||
                    res.totalEntries === undefined
                ) {
                    console.error(res);
                    addNotification({
                        text: `Cannot load entries: ${res.body?.message}`,
                        position: 'top-center',
                        type: 'error',
                        removeAfter: 4000
                    });
                    return;
                }
                entries = groupEntriesByDay(res.entries);
                pages = res.totalPages;
                entryCount = res.totalEntries;
            });

        api.get(auth, '/entries/titles').then((res) => {
            if (!res.entries) {
                console.error(res);
                addNotification({
                    text: `Cannot load entries: ${res.body?.message}`,
                    position: 'top-center',
                    type: 'error',
                    removeAfter: 4000
                });
                return;
            }
            entryTitles = groupEntriesByDay(res.entries);
        });
    }

    reload(page, search);
    $: reload(page, search);
</script>

<div>
    <div>
        <div class="entries-menu">
            <div>
                <Sidebar titles={entryTitles} />
                <a class="primary" href="/deleted">
                    <Bin size="30" /> Bin
                </a>
                <button class="primary" on:click={importPopup}>
                    <TrayArrowUp size="30" /> Import
                </button>
            </div>
            <div>
                <PageCounter
                    {pages}
                    pageLength={PAGE_LENGTH}
                    total={entryCount}
                    bind:page
                />
            </div>

            <div>
                <input type="text" bind:value={search} placeholder="Search..." />
            </div>
        </div>
    </div>
    <div>
        {#each Object.keys(entries).sort((a, b) => b - a) as day}
            <EntryGroup
                entries={entries[day]}
                on:updated={() => reload(page, search)}
                obfuscated={$obfuscated}
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
