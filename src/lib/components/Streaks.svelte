<script lang="ts">
    import { listen } from '$lib/dataChangeEvents';
    import { clientLogger } from '$lib/utils/log';
    import { currentTzOffset, fmtUtc, nowUtc } from '$lib/utils/time';
    import { tooltip } from '@svelte-plugins/tooltips';
    import { onMount } from 'svelte';
    import Fire from 'svelte-material-icons/Fire.svelte';
    import TimerSand from 'svelte-material-icons/TimerSand.svelte';
    import type { Streaks } from '../controllers/entry/entry';
    import type { Auth } from '../controllers/user/user';
    import { api } from '../utils/apiRequest';

    export let auth: Auth;
    export let tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
    export let condensed = false;

    let streaks = null as Streaks | null;
    let loaded = false;
    let error: string | null;

    function madeEntry() {
        // only update when streaks are loaded,
        // and when the streak is running out or is 0
        if (!streaks || (!streaks.runningOut && streaks.current !== 0)) {
            return;
        }

        if (streaks.current === streaks.longest) {
            streaks.longest++;
        }

        streaks = {
            current: streaks.current + 1,
            runningOut: false,
            longest: Math.max(streaks.longest, streaks.current + 1)
        };
    }

    async function loadStreaks() {
        loaded = false;

        const { err, val } = await api.get(auth, '/entries/streaks', {
            // cache busting - otherwise streaks are static through day changes
            x: fmtUtc(nowUtc(), currentTzOffset(), 'YYYY-MM-DD')
        });
        if (err) {
            clientLogger.error('Failed to get streaks', err);
            error = err;
        } else {
            streaks = val;
        }
        loaded = true;
    }

    onMount(loadStreaks);

    listen.entry.onCreate(madeEntry);
    listen.entry.onDelete(async () => {
        // just get the new streaks, very hard to calculate
        // if we should change the streaks when one entry is deleted
        await loadStreaks();
    });

    let tooltipContent = 'Loading...';
    $: if (streaks) {
        tooltipContent =
            (streaks.longest > 0 ? `Longest: ${streaks.longest} days` : '') +
            (streaks.runningOut ? '<br> Make an entry today to continue the Streak!' : '') +
            (streaks.current < 1 ? 'Make an entry to start a Streak!' : '');
    }
</script>

{#key streaks}
    {#if loaded}
        {#if error}
            ???
        {:else if streaks}
            <span
                class="flex-center"
                class:full={!condensed}
                use:tooltip={condensed
                    ? { content: '' }
                    : {
                          content: tooltipContent,
                          position: tooltipPosition
                      }}
            >
                {#if streaks.runningOut}
                    <TimerSand size="25" />
                {:else if streaks.current > 0}
                    <Fire size="25" class="gradient-icon" />
                {:else}
                    <Fire size="25" />
                {/if}
                <span>
                    {#if !condensed}
                        Streak:
                    {/if}
                    <b>
                        {streaks.current}
                    </b>
                    {#if !condensed}
                        days
                    {/if}
                </span>
            </span>
        {/if}
    {:else}
        <span
            class="flex-center"
            use:tooltip={{
                content: '...',
                position: tooltipPosition
            }}
        >
            <Fire size="25" />
            <b>...</b>
        </span>
    {/if}
{/key}

<style lang="less">
    .full {
        display: grid;
        grid-template-columns: 35px 1fr;
        margin: 0 0.5rem;
    }
</style>
