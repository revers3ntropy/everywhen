<script lang="ts">
    import { tooltip } from '@svelte-plugins/tooltips';
    import { onMount } from 'svelte';
    import Fire from 'svelte-material-icons/Fire.svelte';
    import TimerSand from 'svelte-material-icons/TimerSand.svelte';
    import type { Streaks } from '../controllers/entry';
    import type { Auth } from '../controllers/user';
    import { api } from '../utils/apiRequest';

    export let auth: Auth;
    export let tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'bottom';

    let streaks: Streaks | null = null;
    let loaded = false;
    let error: string | null;

    onMount(async () => {
        const { err, val } = await api.get(auth, '/entries/streaks');
        if (err) {
            error = err;
        } else {
            streaks = val;
        }
        loaded = true;
    });

    function makeTooltip(longest: number, runningOut: boolean): string {
        return (
            `Current Streak` +
            (longest > 0 ? ` &#x2022; <br> Longest: ${longest} days` : '') +
            (runningOut
                ? '<br> Make an entry today to continue the Streak!'
                : '')
        );
    }
</script>

{#if loaded}
    {#if error}
        <p>{error}</p>
    {:else if streaks}
        <span
            class="flex-center"
            use:tooltip="{{
                content: makeTooltip(streaks.longest, streaks.runningOut),
                position: tooltipPosition
            }}"
        >
            {#if streaks.runningOut}
                <TimerSand size="25" />
            {:else if streaks.current > 0}
                <span>
                    <Fire size="25" class="gradient-icon" />
                </span>
            {:else}
                <Fire size="25" />
            {/if}
            <b>{streaks.current}</b>
        </span>
    {/if}
{:else}
    <span
        class="flex-center"
        use:tooltip="{{
            content: '...',
            position: tooltipPosition
        }}"
    >
        <Fire size="25" />
        <b>...</b>
    </span>
{/if}
