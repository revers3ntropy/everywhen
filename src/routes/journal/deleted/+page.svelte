<script lang="ts">
    import { onMount } from 'svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import type { App } from '../../../app';
    import Dot from '../../../lib/components/Dot.svelte';
    import Entry from '../../../lib/components/Entry.svelte';
    import type { Entry as EntryController } from '../../../lib/controllers/entry';
    import { obfuscated } from '../../../lib/stores';
    import { api } from '../../../lib/utils/apiRequest';
    import { displayNotifOnErr } from '../../../lib/utils/notifications';

    const { addNotification } = getNotificationsContext();

    export let data: App.PageData;

    let search = '';
    let loaded = false;
    let entries: EntryController[] = [];

    async function reload () {
        const entriesOptions = {
            page: 0,
            pageSize: 10e10,
            search,
            deleted: 1,
        };
        const res = await api
            .get(data, `/entries`, entriesOptions)
            .then(res => displayNotifOnErr(addNotification, res));

        entries = res.entries;
        loaded = true;
    }

    onMount(reload);

    onMount(() => document.title = `Deleted`);

</script>

<svelte:head>
    <title>Deleted</title>
    <meta content="Deleted" name="description" />
</svelte:head>

<main>
    <h1>
        Bin
        {#if entries.length > 0}
            <Dot />
            {entries.length}
        {/if}
    </h1>
    {#each entries as entry}
        <Entry
            {...entry}
            obfuscated={$obfuscated}
            on:updated={reload}
            auth={data}
        />
    {/each}

    {#if !loaded}
        <h2><i>Loading...</i></h2>
    {:else if entries.length === 0}
        <h2><i>No deleted entries.</i></h2>
    {/if}
</main>

<style lang="less">
    h2 {
        width: 100%;
        text-align: center;
    }
</style>
