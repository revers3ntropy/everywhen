<script lang="ts">
    import type { Day } from '$lib/utils/time';
    import moment from 'moment';
    import SvelteHeatmap from 'svelte-heatmap';
    import type { By, HeatMapData } from './helpers';

    export let by: By;
    export let data: Record<By, HeatMapData>;
    export let earliestEntryDay: Day;

    $: currentData = data[by];

    const showMonths = 6;
    const currentMonth = new Date().getMonth();
    const lastJanInCurrentYear = currentMonth <= showMonths;
    const lastJanYear = lastJanInCurrentYear
        ? new Date().getFullYear()
        : new Date().getFullYear() - 1;
</script>

<div class="outer">
    <div class="w-[1200px] md:w-full">
        <SvelteHeatmap
            allowOverflow={true}
            cellGap={1}
            cellRadius={2}
            colors={['#95eab0', '#52d8bd', '#3397bd', '#0051cf']}
            data={currentData}
            emptyColor={'var(--v-light-accent)'}
            fontColor={'var(--text-color-light)'}
            fontSize="9"
            monthGap={4}
            monthLabelHeight={10}
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
            endDate={moment().toDate()}
            view={'monthly'}
        />
    </div>
</div>

<style lang="scss">
    @media #{$mobile} {
        .outer {
            overflow-x: auto;
            direction: rtl;
        }
    }
</style>
