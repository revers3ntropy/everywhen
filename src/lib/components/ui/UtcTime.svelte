<script lang="ts">
    import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
    import type { Hours, Seconds } from '../../../types';
    import { numberAsSignedStr } from '$lib/utils/text';
    import { currentTzOffset, fmtUtc, fmtUtcRelative } from '$lib/utils/time';

    export let timestamp: Seconds;
    export let tzOffset: Hours = currentTzOffset();
    export let fmt = 'h:mma';
    export let relative = false;
    export let noTooltip = false;
</script>

{#if !noTooltip}
    <Popover>
        <PopoverTrigger aria-label="show time info">
            {#if relative}
                {fmtUtcRelative(timestamp)}
            {:else}
                {fmtUtc(timestamp, tzOffset, fmt)}
            {/if}
        </PopoverTrigger>
        <PopoverContent>
            <p class="oneline">
                {fmtUtcRelative(timestamp)} (GMT {numberAsSignedStr(tzOffset)})
            </p>
            <p class="oneline">{fmtUtc(timestamp, 0, 'hh:mma')} GMT </p>
            <p class="oneline">
                {fmtUtc(timestamp, currentTzOffset(), 'hh:mma')} local (GMT{numberAsSignedStr(
                    currentTzOffset()
                )})
            </p>
        </PopoverContent>
    </Popover>
{:else}
    <span>
        {#if relative}
            {fmtUtcRelative(timestamp)}
        {:else}
            {fmtUtc(timestamp, tzOffset, fmt)}
        {/if}
    </span>
{/if}

<style lang="scss">
    * {
        color: inherit;
        font-style: inherit;
        font-size: inherit;

        white-space: nowrap;
    }
</style>
