<script lang="ts">
    import { onMount } from 'svelte';
    import Dot from '../../../lib/components/Dot.svelte';
    import type { Entry } from '../../controllers/entry';
    import type { Auth } from '../../controllers/user';
    import { api, apiPath } from '../../utils/apiRequest';
    import UtcTime from '../UtcTime.svelte';

    export let id: string;
    export let auth: Auth;
    export let entry: Entry | null = null;
    let error: string | null = null;

    async function getEntry () {
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
            <h1>{entry.title}</h1>
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
        max-width: 40vw;
    }

    .datetime {
        :global(*) {
            font-size: 0.9rem;
            color: #444 !important;
        }
    }
</style>