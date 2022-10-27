<svelte:head>
    <title>New tab</title>
</svelte:head>
<script lang="ts">
    import type { PageData } from './$types';
    import type { Entry as EntryType } from '$lib/types';
    import moment from "moment";
    import Time from "svelte-time";
    import Geolocation from "svelte-geolocation";
    import Send from 'svelte-material-icons/Send.svelte';
    import EntryGroup from "$lib/components/EntryGroup.svelte";
    import PageCounter from '$lib/components/PageCounter.svelte';
    import { api } from "$lib/api/apiQuery";
    import { browser } from "$app/environment";
    import { groupEntriesByDay } from "../api/entries/utils.client";

    export let data: PageData;

    // passed from 'load' (+page.server.ts);
    let entries: Record<number, EntryType[]> = {};
    let entryCount = 0;
    let labels = [];

    const PAGE_LENGTH = 4;
    let page = 0;
    let pages = 0;

    let newEntryTitle = '';
    let newEntryBody = '';
    let newEntryLabel = '';
    let currentLocation = [];

    let search = '';

    async function submitEntry () {
        await api.post(data.key, '/entries', {
            title: newEntryTitle,
            entry: newEntryBody,
            label: newEntryLabel,
            latitude: currentLocation[0],
            longitude: currentLocation[1]
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

        const entriesRes = await api.get(data.key,
            `/entries?${new URLSearchParams(entriesOptions).toString()}`);
        entries = groupEntriesByDay(entriesRes.entries);
        pages = entriesRes.totalPages;
        entryCount = entriesRes.totalEntries;

        const labelsRes = await api.get(data.key, `/labels`);
        labels = labelsRes.labels;
    }

    $: reloadEntries(page);
</script>
<main>
    {#if browser}
        <Geolocation
            getPosition="true"
            let:error
            let:notSupported
            bind:coords={currentLocation}
        >
            {#if notSupported}
                Your browser does not support the Geolocation API.
            {:else if error}
                An error occurred fetching geolocation data. {error.code} {error.message}
            {/if}
        </Geolocation>
    {/if}

    <div class="entry-form">
        <input placeholder="Title" class=title bind:value={newEntryTitle} />
        <input placeholder="Label" class=label bind:value={newEntryLabel} />
        <button type="submit" on:click={submitEntry}>
            <Send size="30" />
        </button>
        <hr>
        <textarea placeholder="Entry" class=entry bind:value={newEntryBody}></textarea>
    </div>

    <section>
        <PageCounter pages={pages}
                     pageLength={PAGE_LENGTH}
                     total={entryCount}
                     bind:page
        />
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

    .entry-form {
        border: 1px solid @border;
        margin: 30px;
        text-align: center;
        border-radius: 10px;
    }

    .label {
        border: none;
        width: 25%;
        margin: 10px;
        padding: 10px;
        font-size: 20px;
    }
    .title {
        border: none;
        width: 55%;
        margin: 10px;
        padding: 10px;
        font-size: 20px;
    }

    .entry {
        border-radius: 0;
        outline: none;
        border: none;
        width: 90%;
        max-width: 1500px;
        height: 500px;
        margin: 10px;
        padding: 10px;
        font-size: 20px
    }

    .entry-group-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
</style>