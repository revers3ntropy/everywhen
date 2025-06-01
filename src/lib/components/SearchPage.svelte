<script lang="ts">
    import History from 'svelte-material-icons/History.svelte';
    import { SEARCH_HISTORY_LEN } from '$lib/constants';
    import type { Label } from '$lib/controllers/label/label';
    import type { Location } from '$lib/controllers/location/location';
    import { encryptionKey, searchHistory } from '$lib/stores';
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

    function clearSearchHistory() {
        searchHistory.set([]);
        notify.success('Search history cleared');
    }

    function updateSearchHistory(searchQuery: string) {
        searchQuery = searchQuery?.trim();
        if (!searchQuery) return;
        searchHistory.update(history => {
            if (history.includes(searchQuery)) {
                history = history.filter(item => item !== searchQuery);
            }
            history.unshift(searchQuery);
            return history.slice(0, SEARCH_HISTORY_LEN);
        });
    }

    async function loadSearch(search: string) {
        search = search.trim();
        if (search) {
            results = notify.onErr(await api.get('/search', { q: search })).results;
        } else {
            results = null;
            return;
        }

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
    let results: SearchResults | null = null;

    $: loadSearch(search);
</script>

<div class="py-2 flex">
    <Textbox
        bind:value={search}
        on:focusout={() => updateSearchHistory(search)}
        onChange={() => loadSearch(search)}
        label="Search"
        fullWidth
    />
</div>

{#if !results}
    <section>
        <p class="text-muted-foreground">Search for entries, labels, locations and more</p>

        <div class="border-b border-border pt-4 pb-2 flex justify-between mb-2">
            <p class="flex items-center justify-between gap-2">
                <History size={20} /> Recent
            </p>
            <div>
                <button class="text-light" on:click={clearSearchHistory}>clear history</button>
            </div>
        </div>
        {#each $searchHistory as query}
            <div class="py-1">
                <button on:click={() => (search = query)}>{query}</button>
            </div>
        {:else}
            <p class="text-muted-foreground">No recent searches</p>
        {/each}
    </section>
{:else}
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
{/if}
