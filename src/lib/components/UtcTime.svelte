<script lang="ts">
    import { tooltip } from '@svelte-plugins/tooltips';
    import * as timeago from 'timeago.js';
    import { numberAsSignedStr } from '../utils/text';
    import { currentTzOffset, fmtUtc } from '../utils/time';

    export let timestamp: Seconds;
    export let tzOffset: Hours = currentTzOffset();
    export let fmt = 'h:mma';
    export let relative = false;
    export let noTooltip = false;
    export let tooltipPosition = 'top' as TooltipPosition;
</script>

{#if !noTooltip}
    <span
        use:tooltip={{
            content:
                `<span class="oneline">${fmtUtc(timestamp, tzOffset, 'hh:mma')} (GMT` +
                `${numberAsSignedStr(tzOffset)})</span><br>` +
                `<span class="oneline">${fmtUtc(timestamp, 0, 'hh:mma')} GMT </span><br>` +
                `<span class="oneline">${fmtUtc(timestamp, currentTzOffset(), 'hh:mma')} local ` +
                `(GMT${numberAsSignedStr(currentTzOffset())})</span>`,
            autoPosition: true,
            position: tooltipPosition
        }}
    >
        {#if relative}
            {timeago.format(timestamp * 1000)}
        {:else}
            {fmtUtc(timestamp, tzOffset, fmt)}
        {/if}
    </span>
{:else}
    <span>
        {#if relative}
            {timeago.format(timestamp * 1000)}
        {:else}
            {fmtUtc(timestamp, tzOffset, fmt)}
        {/if}
    </span>
{/if}

<style lang="less">
    * {
        color: inherit;
        font-style: inherit;
        font-size: inherit;

        white-space: nowrap;
    }
</style>
