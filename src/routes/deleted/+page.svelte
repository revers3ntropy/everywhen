<script lang="ts">
    import type { Entry as EntryType } from "$lib/types";
    import { api } from "$lib/api/apiQuery";
    import { getNotificationsContext } from "svelte-notifications";
    import { obfuscated } from "$lib/constants.js";

    import Entry from '$lib/components/Entry.svelte';
    const { addNotification } = getNotificationsContext();

    let entries: EntryType[] = [];
    export let data: Record<string, any>;

    let search = '';

    function reload () {
        const entriesOptions = {
            page: 0,
            pageSize: 10e10,
            search,
            deleted: 1
        }
        api.get(data.key, `/entries?${new URLSearchParams(entriesOptions).toString()}`)
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
                entries = res.entries;
            });
    }

    reload();
</script>
<main>
    <h1>Bin</h1>
    {#each entries as entry}
        <Entry
            {...entry}
            obfuscated={$obfuscated}
            on:updated={reload}
        />
    {/each}

</main>
<style lang="less">

</style>