<script lang="ts">
    import { onMount } from 'svelte';
    import Dot from '$lib/components/Dot.svelte';
    import type { Entry } from '$lib/controllers/entry';
    import type { Auth } from '$lib/controllers/user';
    import { api, apiPath } from '$lib/utils/apiRequest';
    import UtcTime from '../components/UtcTime.svelte';

    export let id: string;
    export let auth: Auth;
    export let entry: Entry | null = null;
    let error: string | null = null;

    async function getEntry() {
        if (entry) return;

        const { err, val } = await api.get(auth, apiPath('/entries/?', id));
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
            />
            <Dot />
            <UtcTime
                timestamp={entry.created}
                relative={true}
                noTooltip={true}
            />
        </div>
        {#if entry.title}
            <h1 class="ellipsis">{entry.title}</h1>
        {/if}
        <p>{entry.entry}</p>
    {:else if error}
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
