<script lang="ts">
    import type { Label } from '$lib/controllers/label/label';
    import type { Location } from '$lib/controllers/location/location';
    import { encryptionKey } from '$lib/stores';
    import { omit } from '$lib/utils';
    import { browser } from '$app/environment';
    import { encrypt } from '$lib/utils/encryption';
    import Entries from '$lib/components/entry/Entries.svelte';
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import LabelLink from '$lib/components/label/LabelLink.svelte';
    import { notify } from '$lib/components/notifications/notifications';
    import { api } from '$lib/utils/apiRequest';
    import type { SearchResults } from '$lib/controllers/search/search';
    import { tryDecryptText } from '$lib/utils/encryption.client';

    export let locations: Location[];
    export let labels: Record<string, Label>;

    async function loadSearch(search: string) {
        let s = search.trim();
        if (s) {
            results = notify.onErr(await api.get('/search', { q: s })).results;
        } else {
            results = [];
        }

        if (!search) return;

        for (const labelId in labels) {
            const nameDecrypted = tryDecryptText(labels[labelId].name);
            if (nameDecrypted.includes(search)) {
                results.push({
                    type: 'label',
                    ...labels[labelId]
                });
            }
        }
    }

    let search = '';
    let results: SearchResults = [];

    $: loadSearch(search);
</script>

<div class="py-2 flex">
    <Textbox bind:value={search} onChange={() => loadSearch(search)} label="Search" fullWidth />
</div>

<section class="flex-col flex gap-4">
    {#each results as result}
        {#if result.type === 'label'}
            <LabelLink {...omit(result, 'type', 'created')} entryCount={0} eventCount={0} />
        {:else}
            ?
        {/if}
    {/each}

    {#if search}
        <Entries
            options={{ search: browser ? encrypt(search, $encryptionKey) : '' }}
            {locations}
            {labels}
        />
    {/if}
</section>
