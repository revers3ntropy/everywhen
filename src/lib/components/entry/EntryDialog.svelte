<script lang="ts">
    import type { Label } from '$lib/controllers/label/label';
    import type { Result } from '$lib/utils/result';
    import { onMount } from 'svelte';
    import type { Location } from '$lib/controllers/location/location';
    import type { Entry as EntryController } from '../../controllers/entry/entry';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import BookSpinner from '../ui/BookSpinner.svelte';
    import Entry from '$lib/components/entry/Entry.svelte';

    export let id: string;
    export let obfuscated = false;
    export let locations: Location[];
    export let labels: Record<string, Label>;

    let entry = null as Result<EntryController> | null;

    async function loadEntry() {
        entry = await api.get(apiPath('/entries/?', id));
    }

    onMount(async () => {
        await loadEntry();
    });
</script>

<div class="min-h-[calc(100vh - 100px)]">
    {#if entry && entry.ok}
        {#key locations}
            <Entry
                {...entry.val}
                isInDialog={true}
                {obfuscated}
                showFullDate={true}
                {locations}
                {labels}
            />
        {/key}
    {:else if entry && entry.err}
        <p>Something went wrong</p>
    {:else}
        <BookSpinner />
    {/if}
</div>
