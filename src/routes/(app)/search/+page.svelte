<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import Entry from '$lib/components/entry/Entry.svelte';
    import { notify } from '$lib/components/notifications/notifications';
    import Textbox from '$lib/components/ui/Textbox.svelte';
    import type { SearchResults } from '$lib/controllers/search/search';
    import { omit } from '$lib/utils';
    import { api } from '$lib/utils/apiRequest';
    import { onMount } from 'svelte';
    import { obfuscated } from '$lib/stores';

    export let data;

    async function loadSearch() {
        results = notify.onErr(await api.get('/search', { q: search })).results;
        console.log(results);
    }

    let search = $page.url.searchParams.get('q') ?? '';
    let results: SearchResults = [];

    $: if (search) loadSearch();

    onMount(() => {
        loadSearch();
    });
</script>

<main class="p-2">
    <div class="py-2 flex">
        <Textbox
            bind:value={search}
            on:change={() => goto(`/search?q=${search}`)}
            label="Search"
            fullWidth
        />
    </div>

    <section class="flex-col flex gap-4">
        {#each results as result}
            <div class="container">
                {#if result.type === 'entry'}
                    <Entry
                        {...omit(result, 'type')}
                        locations={data.locations}
                        obfuscated={$obfuscated}
                    />
                {:else if result.type === 'label'}
                    label
                {:else}
                    ?
                {/if}
            </div>
        {/each}
    </section>
</main>
