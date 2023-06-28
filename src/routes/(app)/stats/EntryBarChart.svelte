<script lang="ts">
    import { browser } from '$app/environment';
    import {
        Chart,
        Title,
        Tooltip,
        Legend,
        BarElement,
        CategoryScale,
        LinearScale
    } from 'chart.js';
    import { Bar } from 'svelte-chartjs';
    import ToggleSwitch from 'svelte-material-icons/ToggleSwitch.svelte';
    import ToggleSwitchOff from 'svelte-material-icons/ToggleSwitchOff.svelte';
    import Select from '$lib/components/Select.svelte';
    import {
        getGraphData,
        type ChartData
    } from './bucketiseEntriesForBarChart';
    import {
        bucketNames,
        By,
        type EntryWithWordCount,
        initialBucket,
        initialBucketName
    } from './helpers';

    Chart.register(
        Title,
        Tooltip,
        Legend,
        BarElement,
        CategoryScale,
        LinearScale
    );

    export let entries: EntryWithWordCount[];
    export let by: By;
    export let days = 0;

    let selectedBucket = initialBucket(days);

    let data: ChartData;

    function toggleBy() {
        by = by === By.Entries ? By.Words : By.Entries;
    }

    // no data fetching so top level
    $: if (entries || by || selectedBucket) {
        data = getGraphData(entries, selectedBucket, by);
    }

    $: axisLabelTextColor = browser
        ? getComputedStyle(
              document.querySelector('.root') as Element
          ).getPropertyValue('--text-color-light')
        : '';
</script>

<Bar
    {data}
    height="400"
    width={browser ? document.body.clientWidth : 1000}
    options={{
        scales: {
            y: {
                border: { display: false },
                ticks: { color: axisLabelTextColor },
                grid: { display: false }
            },
            x: {
                border: { color: 'rgb(78 78 83)' },
                ticks: { color: axisLabelTextColor },
                grid: { display: false }
            }
        }
    }}
/>

<div class="options">
    <div class="flex-center">
        <span class="text-light" style="margin: 0.3rem">Group by</span>
        <Select
            bind:value={selectedBucket}
            key={initialBucketName(days)}
            options={bucketNames}
        />
    </div>
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
</div>

<style lang="less">
    @import '../../../styles/variables';

    .options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0;

        @media @mobile {
            flex-direction: column;
        }
    }

    .container {
        margin: 0;
        padding: 0.3em;
    }

    .toggle-by-button {
        display: flex;
        align-items: center;
        justify-content: space-between;

        :global(svg) {
            margin: 0 0.2rem;
        }
    }
</style>
