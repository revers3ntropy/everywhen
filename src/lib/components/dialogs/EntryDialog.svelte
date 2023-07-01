<script lang="ts">
    import type { Location } from '$lib/controllers/location/location';
    import { onMount } from 'svelte';
    import type { Entry as EntryController } from '../../controllers/entry/entry';
    import type { Auth } from '$lib/controllers/user/user';
    import { popup } from '$lib/stores';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { displayNotifOnErr } from '$lib/components/notifications/notifications';
    import BookSpinner from '../BookSpinner.svelte';
    import Entry from '$lib/components/entry/Entry.svelte';

    export let id: string;
    export let auth: Auth;
    export let obfuscated = false;
    export let hideAgentWidget: boolean;

    let entry: EntryController | null = null;
    let locations = null as Location[] | null;

    async function loadEntry() {
        entry = displayNotifOnErr(await api.get(auth, apiPath('/entries/?', id)), () =>
            popup.set(null)
        );
    }

    async function loadLocations() {
        locations = displayNotifOnErr(await api.get(auth, '/locations')).locations;
    }

    onMount(() => {
        void loadEntry();
        void loadLocations();
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
            {locations}
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
