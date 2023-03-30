<script lang="ts">
    // @ts-ignore
    import { tooltip } from '@svelte-plugins/tooltips';
    import moment from 'moment/moment';
    import { numberAsSignedStr } from '../utils/text';
    import type { Hours, Seconds } from '../utils/types';

    export let timestamp: Seconds;
    export let tzOffset: Hours;
    export let showDate = false;

    let date = moment(new Date(timestamp * 1000));
    let utcDate = moment(new Date((timestamp - tzOffset * 60 * 60) * 1000));
</script>

<span
    class="time"
    use:tooltip={{
        content: `UTC ${utcDate.format('HH:mm')}`
        + ` (${numberAsSignedStr(tzOffset)}h)`
    }}
>
    {#if showDate}
        {date.format('DD/MM/YYYY h:mm A')}
    {:else}
        {date.format('h:mm A')}
    {/if}
</span>