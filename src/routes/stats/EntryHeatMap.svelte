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

    const showMonths = 6;
    const currentMonth = new Date().getMonth();
    const lastJanInCurrentYear = currentMonth <= showMonths;
    const lastJanYear = lastJanInCurrentYear
        ? new Date().getFullYear()
        : new Date().getFullYear() - 1;

</script>

<SvelteHeatmap
    allowOverflow={true}
    cellGap={2}
    cellRadius="50%"
    colors={['#95eab0', '#52d8bd', '#3397bd', '#0051cf']}
    {data}
    dayLabelWidth={20}
    emptyColor={'#dfdfdf'}
    endDate={moment().toDate()}
    fontColor={'#9c9c9c'}
    fontSize="12"
    monthGap={20}
    monthLabelHeight={20}
    monthLabels={[
    `Jan ${lastJanYear}`, 'Feb',
    'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep',
    'Oct', 'Nov', 'Dec',
]}
    startDate={moment().subtract(showMonths, 'months').toDate()}
    view={'monthly'}
/>
