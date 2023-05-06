<script lang="ts">
    import { tooltip } from '@svelte-plugins/tooltips';
    import * as timeago from 'timeago.js';
    import type { Hours, Seconds } from '../../app';
    import { numberAsSignedStr } from '../utils/text';
    import { currentTzOffset, fmtUtc } from '../utils/time';

    export let timestamp: Seconds;
    export let tzOffset: Hours = currentTzOffset();
    export let fmt = 'h:mma';
    export let relative = false;
    export let noTooltip = false;
    export let tooltipPosition = 'top';
</script>

{#if !noTooltip}
    <span
        use:tooltip={{
            content:
                `UTC ${fmtUtc(timestamp, 0, 'hh:mma')}` +
                ` (${numberAsSignedStr(tzOffset)}h)` +
                `<p>${fmtUtc(
                    timestamp,
                    currentTzOffset(),
                    'hh:mma'
                )} local time</p>`,
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
