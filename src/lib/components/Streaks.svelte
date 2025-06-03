<script lang="ts">
    import { listen } from '$lib/dataChangeEvents';
    import { clientLogger } from '$lib/utils/log';
    import { currentTzOffset, fmtUtc, nowUtc } from '$lib/utils/time';
    import { onMount } from 'svelte';
    import Fire from 'svelte-material-icons/Fire.svelte';
    import TimerSand from 'svelte-material-icons/TimerSand.svelte';
    import type { Streaks } from '../controllers/entry/entry';
    import { api } from '../utils/apiRequest';

    export let condensed = false;

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

        const streaksRes = await api.get('/entries/streaks', {
            tz: currentTzOffset(),
            // cache busting - otherwise streaks are static through day changes
            x: fmtUtc(nowUtc(), currentTzOffset(), 'YYYY-MM-DD')
        });
        if (!streaksRes.ok) {
            clientLogger.error('Failed to get streaks', { streaksRes });
            error = streaksRes.err;
        } else {
            streaks = streaksRes.val;
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

    let streaks = null as Streaks | null;
    let loaded = false;
    let error: string | null;
</script>

{#key streaks}
    {#if loaded}
        {#if error}
            Error
        {:else if streaks}
            {#if condensed}
                <span class="flex-center text-sm">
                    {#if streaks.runningOut}
                        <TimerSand size="25" />
                    {:else if streaks.current > 0}
                        <Fire size="25" class="gradient-icon" />
                    {:else}
                        <Fire size="25" />
                    {/if}
                    <span class="flex-center" style="height: 100%">
                        <b>{streaks.current}</b>
                    </span>
                </span>
            {:else}
                <div class="flex items-center gap-3 text-sm">
                    {#if streaks.runningOut}
                        <TimerSand size="25" />
                    {:else if streaks.current > 0}
                        <Fire size="25" class="gradient-icon" />
                    {:else}
                        <Fire size="25" />
                    {/if}
                    <div class="py-1">
                        <div class="oneline">
                            {#if streaks.current < 1}
                                no streak
                            {:else}
                                <b>{streaks.current}</b>
                                day streak
                            {/if}
                        </div>
                        <div class="oneline text-light">
                            <b>{streaks.longest}</b>
                            longest
                        </div>
                    </div>
                </div>
                <p class="text-sm text-muted-foreground py-1">
                    {#if !streaks.runningOut && !(streaks.current < 1)}
                        Come back tomorrow to continue your streak!
                    {:else if streaks.runningOut}
                        Make an entry today to continue the Streak!
                    {:else if streaks.current < 1}
                        Make an entry to start a Streak!
                    {/if}
                </p>
            {/if}
        {/if}
    {:else}
        <span class="flex-center text-sm">
            <Fire size="25" />
            <b>...</b>
        </span>
    {/if}
{/key}
