<script lang="ts">
    import { onMount } from 'svelte';
    import { popup } from '$lib/stores';
    import type { Location } from '$lib/controllers/location/location';
    import type { Entry as EntryController } from '../../controllers/entry/entry';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import BookSpinner from '../BookSpinner.svelte';
    import Entry from '$lib/components/entry/Entry.svelte';

    export let id: string;
    export let obfuscated = false;

    let entry = null as EntryController | null;

    // TODO receive this as a prop
    let locations: Location[] = [];

    async function loadEntry() {
        entry = notify.onErr(await api.get(apiPath('/entries/?', id)), () => popup.set(null));
    }

    async function loadLocations() {
        locations = notify.onErr(await api.get('/locations')).locations;
    }

    onMount(() => {
        void loadEntry();
        void loadLocations();
    });
</script>

<div>
    {#if entry}
        {#key locations}
            <Entry {...entry} isInDialog={true} {obfuscated} showFullDate={true} {locations} />
        {/key}
    {:else}
        <BookSpinner />
    {/if}
</div>

<style lang="scss">
    div {
        min-height: calc(100vh - 100px);
    }
</style>
