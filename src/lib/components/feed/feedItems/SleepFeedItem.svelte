<script lang="ts">
    import FeedItemIcon from '$lib/components/feed/feedItems/FeedItemIcon.svelte';
    import TimeInFeed from '$lib/components/feed/feedItems/TimeInFeed.svelte';
    import { fmtDurationHourMin } from '$lib/utils/time';

    export let tzOffset: number;
    export let start: number;
    export let duration: number;
    export let quality: number | null;
    export let regularity: number | null;
    // svelte-ignore unused-export-let
    export let asleepAfter: number | null;
    export let timeAsleep: number | null;
    export let obfuscated: boolean;
</script>

<FeedItemIcon type="sleep" />
<div class="text-sm pt-2 pb-4 flex gap-y-1 gap-4 flex-wrap">
    <TimeInFeed timestamp={start} to={start + duration} {tzOffset} />
    <div class="basis-full h-0 md:hidden"></div>
    <div class="flex gap-4 px-2 md:p-0" class:obfuscated>
        {#if timeAsleep !== null}
            <span>
                Slept for
                <b>{fmtDurationHourMin(timeAsleep)}</b>
            </span>
        {:else}
            <span>
                <b>{fmtDurationHourMin(duration)}</b> in bed
            </span>
        {/if}
        {#if quality !== null}
            <span>
                <b>{(quality * 100).toFixed(0)}</b>% quality
            </span>
        {/if}
        {#if regularity !== null}
            <span>
                <b>{(regularity * 100).toFixed(0)}</b>% regularity
            </span>
        {/if}
    </div>
</div>
