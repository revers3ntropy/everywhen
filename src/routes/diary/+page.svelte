<script lang="ts">
    import Send from 'svelte-material-icons/Send.svelte';
    import Entry from "$lib/components/Entry.svelte";
    import { api } from "$lib/api/apiQuery";
    import Geolocation from "svelte-geolocation";
    import { browser } from "$app/environment";
    import PageCounter from '$lib/components/PageCounter.svelte';

    // passed from 'load' (+page.server.ts);
    export let data = { entries: [], totalPages: 0 };
    let entries = data.entries || [];
    let labels = [];

    const PAGE_LENGTH = 2;
    let page = 0;
    let pages = data.totalPages || 0;

    let newEntryTitle = '';
    let newEntryBody = '';
    let newEntryLabel = '';
    let currentLocation = [];

    async function submitEntry () {
        await api.post('/entries', {
            title: newEntryTitle,
            entry: newEntryBody,
            label: newEntryLabel,
            latitude: currentLocation[0],
            longitude: currentLocation[1]
        });

        await reloadEntries();
    }

    async function reloadEntries (page_=page) {
        if (!browser) return;
        const response = await api.get(`/entries?pageSize=${PAGE_LENGTH}&page=${page_}`);
        entries = response.entries;
        pages = response.totalPages;
    }

    // '$:' so that it is automatically called when 'page' changes
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
                     total={entries.length}
                     bind:page
        />
        {#each entries as entry}
            <Entry {...entry} on:updated={reloadEntries} />
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
</style>