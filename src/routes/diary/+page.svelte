<svelte:head>
    <title>New Tab</title>
</svelte:head>
<script lang="ts">
    import type { Entry as EntryType } from '$lib/types';
    import moment from "moment";
    import Time from "svelte-time";
    import Sidebar from "./Sidebar.svelte";
    import EntryGroup from "$lib/components/EntryGroup.svelte";
    import PageCounter from '$lib/components/PageCounter.svelte';
    import { api } from "$lib/api/apiQuery";
    import { groupEntriesByDay } from "../api/entries/utils.client";
    import EntryForm from "./EntryForm.svelte";
    import { getNotificationsContext } from "svelte-notifications";
    import Bin from 'svelte-material-icons/Delete.svelte';
    import { obfuscated } from "$lib/constants.js";
    const { addNotification } = getNotificationsContext();

    export let data: Record<string, any>;

    // passed from 'load' (+page.server.ts);
    let entries: Record<number, EntryType[]> = {};
    let entryTitles: Record<number, EntryType[]> = {};
    let entryCount = 0;

    const PAGE_LENGTH = 50;
    let page = 0;
    let pages = 0;

    let search = '';

    let clearEntryForm = () => {};

    async function submitEntry (event: CustomEvent) {
        const { title, entry, label, location } = event.detail;
        const res = await api.post(data.key, '/entries', {
            title,
            entry,
            label,
            latitude: location[0],
            longitude: location[1]
        });

        if (res.id) {
            clearEntryForm();
        } else {
            console.error(res);
            addNotification({
                text: `Cannot create entry: ${res.body.message}`,
                position: 'top-center',
                type: 'error'
            });
        }

        await reloadEntries(page, search);
    }

    async function reloadEntries (page: number, search: string) {
        const entriesOptions = {
            page,
            pageSize: PAGE_LENGTH
        };
        if (search) {
            entriesOptions['search'] = search;
        }

        api.get(data.key, `/entries?${new URLSearchParams(entriesOptions).toString()}`)
            .then(res => {
                if (!res.entries || !res.totalPages || !res.totalEntries) {
                    console.error(res);
                    addNotification({
                        text: `Cannot load entries: ${res.body.message}`,
                        position: 'top-center',
                        type: 'error',
                        removeAfter: 4000,
                    });
                    return;
                }
                entries = groupEntriesByDay(res.entries);
                pages = res.totalPages;
                entryCount = res.totalEntries;
            });

        api.get(data.key, '/entries/titles')
            .then(res => {
                if (!res.entries) {
                    console.error(res);
                    addNotification({
                        text: `Cannot load entries: ${res.body.message}`,
                        position: 'top-center',
                        type: 'error',
                        removeAfter: 4000,
                    });
                    return;
                }
                entryTitles = groupEntriesByDay(res.entries);
            });
    }

    $: reloadEntries(page, search);
</script>
<main>
    <section>
        <EntryForm on:submit={submitEntry}
                   bind:reset={clearEntryForm}
                   key={data.key}
        />
    </section>
    <section>
        <div class="entries-menu">
            <div>
                <Sidebar titles={entryTitles} />
                <a class="primary" href="/deleted">
                    <Bin size="30" /> Bin
                </a>
            </div>
            <div>
                <PageCounter pages={pages}
                             pageLength={PAGE_LENGTH}
                             total={entryCount}
                             bind:page
                />
            </div>

            <div>
                <input type="text"
                       bind:value={search}
                       placeholder="Search..."
                />
            </div>
        </div>
        {#each Object.keys(entries).sort((a, b) => b - a) as day}
            <EntryGroup entries={entries[day]}
                        on:updated={() => { reloadEntries(page, search) }}
                        obfuscated={$obfuscated}
            >
                <div slot="title"
                     class="entry-group-title">
                    <h2>{moment(new Date(day * 1000)).format('dddd, Do MMMM YYYY')}</h2>
                    {#if new Date() - new Date(day * 1000) < 8.64e7}
                        <span>Today</span>
                    {:else if new Date() - new Date(day * 1000) < 1.728e8}
                        <span>Yesterday</span>
                    {:else}
                        <Time relative
                              timestamp={new Date(
                                  day * 1000 + (60 * 60 * 23 + 60 * 60 + 59) * 1000
                              )}
                        />
                    {/if}
                </div>
            </EntryGroup>
        {/each}
    </section>
</main>
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
    }
</style>