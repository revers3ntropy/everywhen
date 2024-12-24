<script lang="ts">
    import { Day } from '$lib/utils/day';
    import Heatmap from '$lib/components/ui/heatmap/Heatmap.svelte';
    import ToggleSwitch from 'svelte-material-icons/ToggleSwitch.svelte';
    import ToggleSwitchOff from 'svelte-material-icons/ToggleSwitchOff.svelte';
    import { By, type HeatMapData } from './helpers';

    export let data: Record<By, HeatMapData>;
    export let earliestEntryDay: Day;

    let by: By = By.Entries;

    function toggleBy() {
        by = by === By.Entries ? By.Words : By.Entries;
    }

    $: currentData = data[by];
    $: goFrom = earliestEntryDay.max(Day.today().plusMonths(-36)).min(Day.today().plusMonths(-6));
</script>

{#if currentData?.length}
    <div class="overflow-x-auto py-2" style="direction: rtl">
        <div style="width: {(goFrom.monthsAgo() + 1) * 100 + 20}px; direction: ltr">
            <Heatmap
                data={currentData}
                view={'weekly'}
                allowOverflow={false}
                cellGap={1}
                cellRadius={1}
                colors={['#95eab0', '#52d8bd', '#3397bd', '#0051cf']}
                emptyColor={'var(--light-accent)'}
                fontColor={'var(--text-color-light)'}
                fontSize={7}
                monthGap={22}
                dayLabelWidth={20}
                dayLabels={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
                startDate={goFrom.dateObj()}
                endDate={Day.today().dateObj()}
            />
        </div>
    </div>
    <button class="flex-center gap-1 bg-vLightAccent rounded-xl px-3 py-1" on:click={toggleBy}>
        <span class:text-light={by !== By.Words}> By Words </span>
        {#if by === By.Entries}
            <ToggleSwitch size="30" />
        {:else}
            <ToggleSwitchOff size="30" />
        {/if}
        <span class:text-light={by !== By.Entries}> By Entries </span>
    </button>
{/if}
