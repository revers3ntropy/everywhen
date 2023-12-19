<script lang="ts">
    import TimeInFeed from '$lib/components/feed/TimeInFeed.svelte';
    import { fmtDurationHourMin } from '$lib/utils/time';
    import Sleep from 'svelte-material-icons/Sleep.svelte';

    export let tzOffset: number;
    export let start: number;
    export let duration: number;
    export let quality: number | null;
    export let regularity: number | null;
    export let obfuscated: boolean;
</script>

<div class="text-sm py-2 md:flex md:gap-4">
    <TimeInFeed timestamp={start} to={start + duration} {tzOffset} />
    <Sleep size="27" />
    <div class="flex gap-4" class:obfuscated>
        <span>
            Slept for
            <b>{fmtDurationHourMin(duration)}</b>
        </span>
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
