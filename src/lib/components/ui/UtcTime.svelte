<script lang="ts">
    import { tooltip } from '@svelte-plugins/tooltips';
    import type { Hours, Seconds, TooltipPosition } from '../../../types';
    import { numberAsSignedStr } from '$lib/utils/text';
    import { currentTzOffset, fmtUtc, fmtUtcRelative } from '$lib/utils/time';

    export let timestamp: Seconds;
    export let tzOffset: Hours = currentTzOffset();
    export let fmt = 'h:mma';
    export let relative = false;
    export let noTooltip = false;
    export let tooltipPosition: TooltipPosition = 'top';
</script>

{#if !noTooltip}
    <span
        use:tooltip={{
            content:
                `<span class="oneline">${fmtUtcRelative(timestamp)} (GMT` +
                `${numberAsSignedStr(tzOffset)})</span><br>` +
                `<span class="oneline">${fmtUtc(timestamp, 0, 'hh:mma')} GMT </span><br>` +
                `<span class="oneline">${fmtUtc(timestamp, currentTzOffset(), 'hh:mma')} local ` +
                `(GMT${numberAsSignedStr(currentTzOffset())})</span>`,
            autoPosition: true,
            position: tooltipPosition
        }}
    >
        {#if relative}
            {fmtUtcRelative(timestamp)}
        {:else}
            {fmtUtc(timestamp, tzOffset, fmt)}
        {/if}
    </span>
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
