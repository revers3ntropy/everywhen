<script lang="ts">
    import { onMount } from 'svelte';
    import type { Entry as EntryController } from '../controllers/entry';
    import type { Auth } from '$lib/controllers/user';
    import { popup } from '$lib/stores';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { displayNotifOnErr } from '$lib/notifications/notifications';
    import BookSpinner from '../components/BookSpinner.svelte';
    import Entry from '../components/Entry.svelte';

    export let id: string;
    export let auth: Auth;
    export let obfuscated = false;
    export let hideAgentWidget: boolean;

    let entry: EntryController | null = null;

    onMount(async () => {
        entry = displayNotifOnErr(
            await api.get(auth, apiPath('/entries/?', id)),
            () => popup.set(null)
        );
    });
</script>

<div>
    {#if entry}
        <Entry
            {...entry}
            isInDialog={true}
            {auth}
            {obfuscated}
            showFullDate={true}
            {hideAgentWidget}
        />
    {:else}
        <BookSpinner />
    {/if}
</div>

<style lang="less">
    div {
        min-height: calc(100vh - 100px);
    }
</style>
