<script lang="ts">
    import { onMount } from 'svelte';
    import Dot from '$lib/components/Dot.svelte';
    import type { Entry } from '$lib/controllers/entry/entry';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { obfuscated } from '$lib/stores';
    import UtcTime from '../UtcTime.svelte';
    import { obfuscate } from '$lib/utils/text';

    export let id: string;
    export let entry: Entry | null = null;
    let error: string | null = null;

    async function getEntry() {
        if (entry) return;

        const { err, val } = await api.get(apiPath('/entries/?', id));
        if (err) {
            error = err;
            return;
        }
        entry = val;
    }

    onMount(getEntry);
</script>

<div class="wrapper">
    {#if entry}
        <div class="datetime">
            <UtcTime
                timestamp={entry.created}
                fmt="ddd Do MMMM YYYY, h:mm a"
                noTooltip={true}
                tzOffset={entry.createdTZOffset}
            />
            <Dot />
            <UtcTime
                timestamp={entry.created}
                relative={true}
                noTooltip={true}
                tzOffset={entry.createdTZOffset}
            />
        </div>
        {#if !$obfuscated}
            {#if entry.title}
                <h3 class="ellipsis">{entry.title}</h3>
            {/if}
            <p>{entry.entry}</p>
        {:else}
            {#if entry.title}
                <h3 class="ellipsis obfuscated">{obfuscate(entry.title)}</h3>
            {/if}
            <p class="obfuscated">{obfuscate(entry.entry)}</p>
        {/if}
    {:else if error}
        <h2 class="text-warning">Error</h2>
        <p>{error}</p>
    {:else}
        <p>Loading...</p>
    {/if}
</div>

<style lang="less">
    .wrapper {
        min-width: 200px;
        max-width: min(40vw, 700px);
    }

    .datetime {
        :global(*) {
            font-size: 0.9rem;
            color: #444 !important;
        }
    }
</style>
