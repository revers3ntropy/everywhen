<script lang="ts">
    import { browser } from '$app/environment';
    import { notify } from '$lib/components/notifications/notifications.js';
    import { encryptionKey } from '$lib/stores';
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
    import Select from '$lib/components/Select.svelte';
    import { getGraphData, type ChartData } from './bucketiseEntriesForBarChart';
    import type { EntryStats, By } from './helpers';
    import {
        Bucket,
        bucketNames,
        decryptUserAgentsBackground,
        initialBucket,
        initialBucketName
    } from './helpers';
    import { cssVarValue } from '$lib/utils/getCssVar';
    import { Day } from '$lib/utils/time';

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

    export let entries: EntryStats[];
    export let by: By;
    export let days: number;

    function entriesExistOnMultipleDays(entries: EntryStats[]) {
        if (entries.length === 0) return false;
        let day = Day.fromTimestamp(entries[0].created, entries[0].createdTzOffset);
        for (let i = 1; i < entries.length; i++) {
            if (!day.eq(Day.fromTimestamp(entries[i].created, entries[i].createdTzOffset)))
                return true;
        }
        return false;
    }

    let selectedBucket = initialBucket(days);

    let mainGraphData: ChartData | null;
    let smallGraph1Data: ChartData | null;
    let smallGraph2Data: ChartData | null;

    // no data fetching so top level
    $: if (browser) {
        mainGraphData = getGraphData(entries, selectedBucket, by);
        smallGraph1Data = getGraphData(entries, Bucket.Hour, by);
    }
    $: if (browser && $encryptionKey) {
        void decryptUserAgentsBackground(entries, $encryptionKey).then(entries => {
            smallGraph2Data = getGraphData(notify.onErr(entries), Bucket.OperatingSystem, by, {
                borderColor: 'transparent',
                borderRadius: 4
            });
        });
    }
    $: shouldShowMainGraph = entriesExistOnMultipleDays(entries);

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

{#if shouldShowMainGraph}
    {#if mainGraphData !== null}
        <div style="height: 350px">
            <Line data={mainGraphData} options={options()} />
        </div>
    {/if}
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
            {#if smallGraph1Data !== null}
                <Line data={smallGraph1Data} options={options()} />
            {:else}
                <p class="italic text-textColorLight"> No data </p>
            {/if}
        </div>
    </div>
    <div>
        <h3> Device </h3>
        <div style="height: 250px; width: calc(100% - 1rem)">
            {#if smallGraph2Data !== null}
                <Bar data={smallGraph2Data} options={options()} />
            {:else}
                <p class="italic text-textColorLight"> No data </p>
            {/if}
        </div>
    </div>
</div>

<style lang="scss">
    .smaller-charts {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-gap: 1rem;
        margin: 1rem 0 0 0;

        @media #{$mobile} {
            grid-template-columns: 1fr;
        }

        &.showing-main-graph {
            border-top: 1px solid var(--border-color);
            padding-top: 1rem;
        }
    }
</style>
