<script lang="ts">
    import { getNotificationsContext } from 'svelte-notifications';
    import type { App } from '../../app';
    import { api } from '../../lib/api/apiQuery';
    import Entry from '../../lib/components/Entry.svelte';
    import { obfuscated } from '../../lib/constants.js';
    import { Entry as EntryType } from '../../lib/controllers/entry';

    const { addNotification } = getNotificationsContext();

    export let data: App.PageData;

    let search = '';
    let entries: EntryType[] = [];

    function reload () {
        const entriesOptions = {
            page: 0,
            pageSize: 10e10,
            search,
            deleted: 1,
        };
        api.get(data, `/entries`, entriesOptions)
           .then((res) => {
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
               entries = res.entries;
           });
    }

    reload();
</script>

<main>
    <h1>Bin</h1>
    {#each entries as entry}
        <Entry {...entry} obfuscated={$obfuscated} on:updated={reload} />
    {/each}

    {#if entries.length === 0}
        <h2><i>No deleted items.</i></h2>
    {/if}
</main>

<style lang="less">
    h2 {
        width: 100%;
        text-align: center;
    }
</style>
