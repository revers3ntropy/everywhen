<script lang="ts">
    import { browser } from '$app/environment';
    import 'chart.js/auto';
    import moment from 'moment';
    // https://www.npmjs.com/package/svelte-chartjs
    import { Bar } from 'svelte-chartjs';
    import ToggleSwitch from 'svelte-material-icons/ToggleSwitch.svelte';
    import ToggleSwitchOff from 'svelte-material-icons/ToggleSwitchOff.svelte';
    import Select from '../../lib/components/Select.svelte';
    import type { Entry } from '../../lib/controllers/entry';
    import { splitText, wordCount } from '../../lib/utils/text';
    import { nowS } from '../../lib/utils/time';
    import type { Seconds } from '../../lib/utils/types';
    import { Bucket, bucketiseTime, bucketSize, By } from './helpers';

    export let entries: Entry[];
    export let by: By;

    interface ChartData {
        datasets: {
            data: number[], label: string
        }[],
        labels: string[]
    }

    let selectedBucket = Bucket.Week;

    let data: ChartData;
    let filter = '';
    let filterCaseSensitive = false;

    function toggleBy () {
        by = (by === By.Entries) ? By.Words : By.Entries;
    }

    function generateLabels (start: Seconds, buckets: Seconds[]) {
        let year = moment(start * 1000).year();
        return buckets.map(k => {
            const thisYear = moment(k * 1000).year();
            if (selectedBucket === Bucket.Year) {
                return moment(k * 1000).format('YYYY');
            }
            if (selectedBucket === Bucket.Month) {
                if (thisYear !== year) {
                    year = thisYear;
                    return moment(k * 1000).format('MMM YYYY');
                }
                return moment(k * 1000).format('MMM');
            }

            if (thisYear !== year) {
                year = thisYear;
                return moment(k * 1000).format('Do MMM YYYY');
            }
            return moment(k * 1000).format('Do MMM');
        });
    }


    function getGraphData (
        entries: Entry[],
        selectedBucket: Bucket,
        by: By,
    ): ChartData {
        let filteredWords = splitText(filter);
        if (!filterCaseSensitive) {
            filteredWords = filteredWords.map(w => w.toLowerCase());
        }

        const sortedFilteredEntries = entries
            .filter(e => {
                if (filter === '') {
                    return true;
                }
                let words = splitText(e.entry);
                if (!filterCaseSensitive) {
                    words = words.map(w => w.toLowerCase());
                }
                return words.some(w => filteredWords.includes(w));
            })
            .sort((a, b) => a.created - b.created);

        const buckets: Record<string, number> = {};
        const start = sortedFilteredEntries[0].created;
        const end = nowS() + bucketSize(selectedBucket);
        for (let i = start; i < end; i += bucketSize(selectedBucket)) {
            buckets[bucketiseTime(i, selectedBucket).toString()] = 0;
        }

        for (const entry of sortedFilteredEntries) {
            const bucket = bucketiseTime(entry.created, selectedBucket);
            buckets[bucket.toString()] += (by === By.Entries) ? 1 : wordCount(entry.entry);
        }

        const labels = generateLabels(
            start,
            Object.keys(buckets)
                  .map(k => parseInt(k)),
        );

        const dataset = {
            data: Object.values(buckets),
            label: by === By.Entries ? 'Entries' : 'Words',
        };

        return {
            labels,
            datasets: [ dataset ],
        };
    }

    function reloadChart (): void {
        data = getGraphData(entries, selectedBucket, by);
    }

    // no data fetching so top level
    $: [ entries, by, selectedBucket, reloadChart() ];
</script>

<Bar
    {data}
    height="400"
    width={browser ? document.body.clientWidth : 1000}
/>

<div class="options">
    <div class="flex-center">
        <div>Group by</div>
        <Select
            bind:value={selectedBucket}
            key="Week"
            options={{
                Year: Bucket.Year,
                Month: Bucket.Month,
                Week: Bucket.Week,
                Day: Bucket.Day,
            }}
        />
    </div>
    <div>
        <button
            class="primary"
            on:click={toggleBy}
            style="
                /* Stop the button changing size when toggled */
                width: 10rem
            "
        >
            {#if by === By.Entries}
                <ToggleSwitch size="30" />
                By Words
            {:else}
                <ToggleSwitchOff size="30" />
                By Entries
            {/if}
        </button>
    </div>
</div>

<style lang="less">
    @import '../../styles/variables.less';

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

</style>