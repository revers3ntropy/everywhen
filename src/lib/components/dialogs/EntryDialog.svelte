<script lang="ts">
    import type { Label } from '$lib/controllers/label/label';
    import { onMount } from 'svelte';
    import { popup } from '$lib/stores';
    import type { Location } from '$lib/controllers/location/location';
    import type { Entry as EntryController } from '../../controllers/entry/entry';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { notify } from '$lib/components/notifications/notifications';
    import BookSpinner from '../ui/BookSpinner.svelte';
    import Entry from '$lib/components/entry/Entry.svelte';

    export let id: string;
    export let obfuscated = false;
    export let locations: Location[];
    export let labels: Record<string, Label>;

    let entry = null as EntryController | null;

    async function loadEntry() {
        entry = notify.onErr(await api.get(apiPath('/entries/?', id)), () => popup.set(null));
    }

    onMount(async () => {
        await loadEntry();
    });
</script>

<div class="min-h-[calc(100vh - 100px)]">
    {#if entry}
        {#key locations}
            <Entry
                {...entry}
                isInDialog={true}
                {obfuscated}
                showFullDate={true}
                {locations}
                {labels}
            />
        {/key}
    {:else}
        <BookSpinner />
    {/if}
</div>
