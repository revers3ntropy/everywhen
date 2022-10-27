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

    export let data: Record<string, any>;

    // passed from 'load' (+page.server.ts);
    let entries: Record<number, EntryType[]> = {};
    let entryTitles: Record<number, EntryType[]> = {};
    let entryCount = 0;

    const PAGE_LENGTH = 50;
    let page = 0;
    let pages = 0;

    let search = '';

    async function submitEntry (event) {
        const { title, entry, label, location } = event.detail;
        await api.post(data.key, '/entries', {
            title,
            entry,
            label,
            latitude: location[0],
            longitude: location[1]
        });

        await reloadEntries(page);
    }

    async function reloadEntries (page) {
        const entriesOptions = {
            page,
            pageSize: PAGE_LENGTH
        };
        if (search) {
            entriesOptions['search'] = search;
        }

        api.get(data.key, `/entries?${new URLSearchParams(entriesOptions).toString()}`)
            .then(res => {
                entries = groupEntriesByDay(res.entries);
                pages = res.totalPages;
                entryCount = res.totalEntries;
            });

        api.get(data.key, '/entries/titles')
            .then(res => {
                entryTitles = groupEntriesByDay(res.entries);
            });
    }

    $: reloadEntries(page);
</script>
<main>
    <section>
        <EntryForm on:submit={submitEntry} />
    </section>
    <section>
        <div class="entries-menu">
            <Sidebar titles={entryTitles} />
            <PageCounter pages={pages}
                         pageLength={PAGE_LENGTH}
                         total={entryCount}
                         bind:page
            />
            <div></div>
        </div>
        {#each Object.keys(entries).sort((a, b) => b - a) as day}
            <EntryGroup entries={entries[day]}
                        on:updated={() => reloadEntries(page)}
            >
                <div slot="title"
                     class="entry-group-title">
                    <h2>{moment(new Date(day * 1000)).format('dddd, MMMM Do YYYY')}</h2>
                    {#if new Date() - new Date(day * 1000) < 86400000}
                        <span>Today</span>
                    {:else if new Date() - new Date(day * 1000) < 172800000}
                        <span>Yesterday</span>
                    {:else}
                        <Time relative timestamp={new Date(day * 1000)} />
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
    }
</style>