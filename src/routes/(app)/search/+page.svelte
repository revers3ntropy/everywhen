<script lang="ts">
    import { browser } from '$app/environment';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import Entries from '$lib/components/entry/Entries.svelte';
    import LabelLink from '$lib/components/label/LabelLink.svelte';
    import { notify } from '$lib/components/notifications/notifications';
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import type { SearchResults } from '$lib/controllers/search/search';
    import { omit } from '$lib/utils';
    import { api } from '$lib/utils/apiRequest';
    import { encrypt } from '$lib/utils/encryption';
    import { onMount } from 'svelte';
    import { encryptionKey } from '$lib/stores';

    export let data;

    async function loadSearch() {
        let s = search.trim();
        if (s) {
            results = notify.onErr(await api.get('/search', { q: s })).results;
        } else {
            results = [];
        }
    }

    let search = $page.url.searchParams.get('q') ?? '';
    let results: SearchResults = [];

    page.subscribe(() => {
        if (browser) loadSearch();
    });

    onMount(() => {
        loadSearch();
    });
</script>

<main class="md:p-4 md:pl-4 flex-center">
    <div class="w-full md:max-w-5xl">
        <div class="py-2 flex">
            <Textbox
                bind:value={search}
                on:change={() => goto(`/search?q=${search}`)}
                on:input={loadSearch}
                label="Search"
                fullWidth
            />
        </div>

        <section class="flex-col flex gap-4">
            {#each results as result}
                {#if result.type === 'label'}
                    <LabelLink {...omit(result, 'type', 'created', 'editCount')} />
                {:else}
                    ?
                {/if}
            {/each}

            {#if search}
                <Entries
                    options={{ search: browser ? encrypt(search, $encryptionKey) : '' }}
                    locations={data.locations}
                    labels={data.labels}
                />
            {/if}
        </section>
    </div>
</main>
