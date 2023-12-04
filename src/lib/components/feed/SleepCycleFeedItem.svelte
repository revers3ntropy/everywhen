<script lang="ts">
    import UtcTime from '$lib/components/UtcTime.svelte';
    import { fmtDurationHourMin } from '$lib/utils/time';
    import Sleep from 'svelte-material-icons/Sleep.svelte';

    export let tzOffset: number;
    export let start: number;
    export let duration: number;
    export let quality: number | null;
    export let regularity: number | null;
    export let obfuscated: boolean;
</script>

<div class="text-sm p-2 md:flex md:gap-4">
    <div class="flex gap-3 pb-2">
        <span class=" text-textColorLight">
            <UtcTime timestamp={start} {tzOffset} fmt="h:mma" />
            -
            <UtcTime timestamp={start + duration} {tzOffset} fmt="h:mma" />
        </span>
        <Sleep size="27" class="pl-2" />
    </div>

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
