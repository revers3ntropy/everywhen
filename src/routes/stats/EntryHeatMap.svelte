<script lang="ts">
    import moment from 'moment';
    // @ts-ignore
    import SvelteHeatmap from 'svelte-heatmap';
    import { Entry } from '../../lib/controllers/entry';
    import { wordCount } from '../../lib/utils.js';
    import { By } from './helpers';

    export let entries: Entry[];
    export let by: By;
    let data;

    function reloadChart (entries: Entry[], by: By) {
        data = entries.map((entry) => {
            return {
                date: new Date(entry.created * 1000),
                value: by === By.Entries
                    ? 1
                    : wordCount(entry.entry),
            };
        });
    }

    $: reloadChart(entries, by);

</script>

<SvelteHeatmap
    allowOverflow={true}
    cellGap={2}
    cellRadius="50%"
    colors={['#95eab0', '#52d8bd', '#3397bd', '#0051cf']}
    {data}
    dayLabelWidth={20}
    emptyColor={'#c7c7c7'}
    endDate={moment().toDate()}
    fontSize="12"
    monthGap={20}
    monthLabelHeight={20}
    startDate={moment().subtract(6, 'months').toDate()}
    view={'monthly'}
/>