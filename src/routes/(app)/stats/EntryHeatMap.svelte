<script lang="ts">
    import { Day } from '$lib/utils/day';
    import SvelteHeatmap from 'svelte-heatmap';
    import type { By, HeatMapData } from './helpers';

    export let by: By;
    export let data: Record<By, HeatMapData>;
    export let earliestEntryDay: Day;

    $: currentData = data[by];
    $: goFrom = earliestEntryDay.monthsAgo() < 6 ? Day.today().plusMonths(-6) : earliestEntryDay;
</script>

<div class="overflow-x-auto py-2" style="direction: rtl">
    <div style="width: {(goFrom.monthsAgo() + 1) * 100 + 20}px; direction: ltr">
        <SvelteHeatmap
            data={currentData}
            view={'weekly'}
            allowOverflow={true}
            cellGap={2}
            cellRadius={2}
            colors={['#95eab0', '#52d8bd', '#3397bd', '#0051cf']}
            emptyColor={'var(--light-accent)'}
            fontColor={'var(--text-color-light)'}
            fontSize={9}
            monthGap={20}
            monthLabelHeight={12}
            dayLabelWidth={20}
            monthLabels={[
                `Jan`,
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
            startDate={goFrom.dateObj()}
            endDate={Day.today().dateObj()}
        />
    </div>
</div>
