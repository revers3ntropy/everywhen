<script lang="ts">
    import {
        Chart,
        Title,
        Tooltip,
        Legend,
        BarElement,
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement
    } from 'chart.js';
    import { Line, Bar } from 'svelte-chartjs';
    import ToggleSwitch from 'svelte-material-icons/ToggleSwitch.svelte';
    import ToggleSwitchOff from 'svelte-material-icons/ToggleSwitchOff.svelte';
    import Select from '$lib/components/Select.svelte';
    import { getGraphData, type ChartData } from './bucketiseEntriesForBarChart';
    import { Bucket, bucketNames, By, initialBucket, initialBucketName } from './helpers';
    import { cssVarValue } from '$lib/utils/getCssVar';
    import type { EntrySummary } from '$lib/controllers/entry/entry';
    import { Entry } from '$lib/controllers/entry/entry';

    Chart.register(
        Title,
        Tooltip,
        Legend,
        BarElement,
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement
    );

    export let entries: EntrySummary[];
    export let by: By;
    export let days = 0;

    let selectedBucket = initialBucket(days);

    let mainGraphData: ChartData;
    let smallGraph1Data: ChartData;
    let smallGraph2Data: ChartData;

    function toggleBy() {
        by = by === By.Entries ? By.Words : By.Entries;
    }

    // no data fetching so top level
    $: if (entries || by || selectedBucket) {
        mainGraphData = getGraphData(entries, selectedBucket, by);
    }
    $: if (entries || by) {
        smallGraph1Data = getGraphData(entries, Bucket.Hour, by);
        smallGraph2Data = getGraphData(entries, Bucket.OperatingSystem, by, {
            borderColor: 'transparent',
            borderRadius: 4
        });
    }
    $: shouldShowMainGraph = Object.keys(Entry.groupEntriesByDay(entries)).length > 1;

    const options = () => ({
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                border: { color: cssVarValue('--border-light') },
                ticks: { color: cssVarValue('--text-color-light') },
                grid: { display: false },
                suggestedMin: 0
            },
            x: {
                border: { color: cssVarValue('--border-light') },
                ticks: { color: cssVarValue('--text-color-light') },
                grid: { display: false }
            }
        }
    });

    const optionsForMainChart = { ...bucketNames };
    // separate graphs for these metrics
    delete optionsForMainChart['Operating System'];
    delete optionsForMainChart['Hour'];
</script>

<div>
    <button class="toggle-by-button" on:click={toggleBy}>
        By Words
        {#if by === By.Entries}
            <ToggleSwitch size="30" />
        {:else}
            <ToggleSwitchOff size="30" />
        {/if}
        By Entries
    </button>
</div>
{#if shouldShowMainGraph}
    <div style="height: 350px">
        <Line data={mainGraphData} options={options()} />
    </div>
    <div>
        <span class="text-light" style="margin: 0.3rem"> Group by </span>
        <Select
            bind:value={selectedBucket}
            key={initialBucketName(days)}
            options={optionsForMainChart}
        />
    </div>
{/if}

<div class="smaller-charts" class:showing-main-graph={shouldShowMainGraph}>
    <div>
        <h3> Time of Day </h3>
        <div style="height: 250px; width: calc(100% - 1rem)">
            <Line data={smallGraph1Data} options={options()} />
        </div>
    </div>
    <div>
        <h3> Device </h3>
        <div style="height: 250px; width: calc(100% - 1rem)">
            <Bar data={smallGraph2Data} options={options()} />
        </div>
    </div>
</div>

<style lang="less">
    @import '../../../styles/variables';

    .toggle-by-button {
        display: flex;
        align-items: center;
        justify-content: space-between;

        :global(svg) {
            margin: 0 0.2rem;
        }
    }

    .smaller-charts {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-gap: 1rem;
        margin: 1rem 0 0 0;

        @media @mobile {
            grid-template-columns: 1fr;
        }

        &.showing-main-graph {
            border-top: 1px solid var(--border-color);
            padding-top: 1rem;
        }
    }
</style>
