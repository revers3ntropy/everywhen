<script lang="ts">
    import type { EntrySummary } from '$lib/controllers/entry/entry';
    import moment from 'moment';
    import SvelteHeatmap from 'svelte-heatmap';
    import { By } from './helpers';

    export let entries: EntrySummary[];
    export let by: By;
    let data: { date: Date; value: number }[] = [];

    function reloadChart() {
        data = entries.map(entry => {
            return {
                date: new Date(entry.created * 1000),
                value: by === By.Entries ? 1 : entry.wordCount
            };
        });
    }

    $: if (entries && typeof by === 'number') reloadChart();

    const showMonths = 6;
    const currentMonth = new Date().getMonth();
    const lastJanInCurrentYear = currentMonth <= showMonths;
    const lastJanYear = lastJanInCurrentYear
        ? new Date().getFullYear()
        : new Date().getFullYear() - 1;
</script>

<div class="outer">
    <div class="inner">
        <SvelteHeatmap
            allowOverflow={true}
            cellGap={2}
            cellRadius="50%"
            colors={['#95eab0', '#52d8bd', '#3397bd', '#0051cf']}
            {data}
            dayLabelWidth={20}
            emptyColor={'var(--light-accent)'}
            endDate={moment().toDate()}
            fontColor={'var(--text-color-light)'}
            fontSize="12"
            monthGap={20}
            monthLabelHeight={20}
            monthLabels={[
                `Jan ${lastJanYear}`,
                'Feb',
                'Mar',
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec'
            ]}
            startDate={moment().subtract(showMonths, 'months').toDate()}
            view={'monthly'}
        />
    </div>
</div>

<style lang="less">
    @import '../../../styles/variables';

    @media @mobile {
        .outer {
            overflow-x: auto;
            direction: rtl;

            .inner {
                width: 1200px;
            }
        }
    }
</style>
