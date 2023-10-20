<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications';
    import { onMount } from 'svelte';
    import Dot from '$lib/components/Dot.svelte';
    import type { Entry } from '$lib/controllers/entry/entry';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import { obfuscated } from '$lib/stores';
    import UtcTime from '../UtcTime.svelte';

    export let id: string;
    export let entry: Entry | null = null;

    async function getEntry() {
        if (entry) return;

        entry = notify.onErr(await api.get(apiPath('/entries/?', id)));
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
                tzOffset={entry.createdTzOffset}
            />
            <Dot />
            <UtcTime
                timestamp={entry.created}
                relative={true}
                noTooltip={true}
                tzOffset={entry.createdTzOffset}
            />
        </div>
        {#if entry.title}
            <h3 class="ellipsis" class:obfuscated={$obfuscated}>{entry.title}</h3>
        {/if}
        <p class:obfuscated={$obfuscated}>{entry.body}</p>
    {:else}
        <p>Loading...</p>
    {/if}
</div>

<style lang="scss">
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
