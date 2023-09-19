<script lang="ts">
    import moment from 'moment';
    import SvelteHeatmap from 'svelte-heatmap';
    import type { By, HeatMapData } from './helpers';

    export let by: By;
    export let data: Record<By, HeatMapData>;

    $: currentData = data[by];

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
            data={currentData}
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

<style lang="scss">
    @media #{$mobile} {
        .outer {
            overflow-x: auto;
            direction: rtl;

            .inner {
                width: 1200px;
            }
        }
    }
</style>
