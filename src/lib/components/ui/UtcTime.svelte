<script lang="ts">
    import * as Tooltip from '$lib/components/ui/tooltip';
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
    <Tooltip.Root>
        <Tooltip.Trigger>
            <span>
                {#if relative}
                    {fmtUtcRelative(timestamp)}
                {:else}
                    {fmtUtc(timestamp, tzOffset, fmt)}
                {/if}
            </span>
        </Tooltip.Trigger>
        <Tooltip.Content>
            <div>
                <p class="oneline">
                    {fmtUtcRelative(timestamp)} (GMT {numberAsSignedStr(tzOffset)})
                </p>
                <p class="oneline">{fmtUtc(timestamp, 0, 'hh:mma')} GMT </p>
                <p class="oneline">
                    {fmtUtc(timestamp, currentTzOffset(), 'hh:mma')} local (GMT{numberAsSignedStr(
                        currentTzOffset()
                    )})
                </p>
            </div>
        </Tooltip.Content>
    </Tooltip.Root>
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
