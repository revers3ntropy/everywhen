<script lang="ts">
    import UtcTime from '$lib/components/UtcTime.svelte';
    import { fmtDurationHourMin } from '$lib/utils/time';
    import Sleep from 'svelte-material-icons/Sleep.svelte';

    export let tzOffset: number;
    export let start: number;
    export let duration: number;
    export let quality: number | null;
    export let regularity: number | null;
</script>

<div class="text-sm p-2 md:flex md:gap-4">
    <div class="flex gap-3 text-textColorLight pb-2">
        <UtcTime timestamp={start} {tzOffset} fmt="h:mma" />
        <Sleep size="22" />
    </div>

    <div class="flex gap-4">
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
