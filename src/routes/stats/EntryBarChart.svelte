<script lang="ts">
    import { browser } from '$app/environment';
    import 'chart.js/auto';
    import moment from 'moment';
    import { Bar } from 'svelte-chartjs';
    import ToggleSwitch from 'svelte-material-icons/ToggleSwitch.svelte';
    import ToggleSwitchOff from 'svelte-material-icons/ToggleSwitchOff.svelte';
    import Select from '$lib/components/Select.svelte';
    import { currentTzOffset, fmtUtc, nowUtc } from '$lib/utils/time';
    import type { Seconds } from '$lib/utils/types';
    import {
        Bucket,
        bucketiseTime,
        bucketSize,
        By,
        type EntryWithWordCount
    } from './helpers';

    export let entries: EntryWithWordCount[];
    export let by: By;
    export let days = 0;

    interface ChartData {
        datasets: {
            data: number[];
            label: string;
        }[];
        labels: string[];
    }

    let selectedBucket = days < 15 ? Bucket.Day : Bucket.Week;

    let data: ChartData;

    function toggleBy() {
        by = by === By.Entries ? By.Words : By.Entries;
    }

    function generateHourLabels(): string[] {
        const today = moment().startOf('day').unix();
        return Array(24)
            .fill(0)
            .map((_, i) => {
                const hour = i % 24;
                const day = Math.floor(i / 24);
                const date = today + day * 24 * 60 * 60;
                return fmtUtc(date + hour * 60 * 60, currentTzOffset(), 'ha');
            });
    }

    function generateLabels(start: Seconds, buckets: Seconds[]): string[] {
        let year = parseInt(fmtUtc(start, currentTzOffset(), 'YYYY'));
        return buckets.map(k => {
            if (selectedBucket === Bucket.Year) {
                return fmtUtc(k, currentTzOffset(), 'YYYY');
            }

            const thisYear = parseInt(fmtUtc(k, currentTzOffset(), 'YYYY'));
            if (selectedBucket === Bucket.Month) {
                if (thisYear !== year) {
                    year = thisYear;
                    return fmtUtc(k, currentTzOffset(), 'MMM YYYY');
                }
                return fmtUtc(k, currentTzOffset(), 'MMM');
            }

            if (thisYear !== year) {
                year = thisYear;
                return fmtUtc(k, currentTzOffset(), 'Do MMM YYYY');
            }
            return fmtUtc(k, currentTzOffset(), 'Do MMM');
        });
    }

    // Treat hours differently because it is showing the distribution of entries
    // over the day, not the total number of entries in a given -
    // entries at 3pm on different days go in the same bucket.
    function graphDataHours(
        sortedEntries: EntryWithWordCount[],
        by: By
    ): ChartData {
        const buckets = Array<number>(24).fill(0);

        for (const entry of sortedEntries) {
            const bucket = parseInt(
                fmtUtc(entry.created, entry.createdTZOffset, 'H')
            );
            buckets[bucket] += by === By.Entries ? 1 : entry.wordCount;
        }

        return {
            labels: generateHourLabels(),
            datasets: [
                {
                    data: Object.values(buckets),
                    label: by === By.Entries ? 'Entries' : 'Words'
                }
            ]
        };
    }

    function getGraphData(
        entries: EntryWithWordCount[],
        selectedBucket: Bucket,
        by: By
    ): ChartData {
        const sortedEntries = entries.sort((a, b) => a.created - b.created);

        if (selectedBucket === Bucket.Hour) {
            return graphDataHours(sortedEntries, by);
        }

        const buckets: Record<string, number> = {};
        const start = sortedEntries[0].created;
        const end = nowUtc();
        for (let i = start; i < end; i += bucketSize(selectedBucket)) {
            buckets[bucketiseTime(i, selectedBucket).toString()] = 0;
        }

        for (const entry of sortedEntries) {
            const bucket = bucketiseTime(entry.created, selectedBucket);
            buckets[bucket.toString()] +=
                by === By.Entries ? 1 : entry.wordCount;
        }

        return {
            labels: generateLabels(
                start,
                Object.keys(buckets).map(k => parseInt(k))
            ),
            datasets: [
                {
                    data: Object.values(buckets),
                    label: by === By.Entries ? 'Entries' : 'Words'
                }
            ]
        };
    }

    // no data fetching so top level
    $: if (entries || by || selectedBucket) {
        data = getGraphData(entries, selectedBucket, by);
    }
</script>

<Bar {data} height="400" width={browser ? document.body.clientWidth : 1000} />

<div class="options">
    <div class="flex-center">
        <div>Group by</div>
        <Select
            bind:value={selectedBucket}
            key={days < 15 ? 'Day' : 'Week'}
            options={{
                Year: Bucket.Year,
                Month: Bucket.Month,
                Week: Bucket.Week,
                Day: Bucket.Day,
                Hour: Bucket.Hour
            }}
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
    @import '../../styles/variables';

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
