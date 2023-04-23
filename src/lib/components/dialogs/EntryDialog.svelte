<script lang="ts">
    import { onMount } from 'svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import type { Entry as EntryController } from '../../controllers/entry';
    import type { Auth } from '../../controllers/user';
    import { popup } from '../../stores';
    import { api, apiPath } from '../../utils/apiRequest';
    import { displayNotifOnErr } from '../../utils/notifications';
    import BookSpinner from '../BookSpinner.svelte';
    import Entry from '../Entry.svelte';

    const { addNotification } = getNotificationsContext();

    export let id: string;
    export let auth: Auth;
    export let obfuscated = false;

    let entry: EntryController | null = null;

    onMount(async () => {
        entry = displayNotifOnErr(
            addNotification,
            await api.get(auth, apiPath('/entries/?', id)),
            {},
            () => popup.set(null)
        );
    });
</script>

<div>
    {#if entry}
        <Entry
            {...entry}
            isInDialog="{true}"
            auth="{auth}"
            obfuscated="{obfuscated}"
            showFullDate="{true}"
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
