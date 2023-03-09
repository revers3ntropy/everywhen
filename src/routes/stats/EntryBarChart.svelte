<script lang="ts">
    import { browser } from '$app/environment';
    import 'chart.js/auto';
    import moment from 'moment';
    // https://www.npmjs.com/package/svelte-chartjs
    import { Bar } from 'svelte-chartjs';
    import { Entry } from '../../lib/controllers/entry';
    import { nowS, splitText, wordCount } from '../../lib/utils';
    import { By } from './helpers';

    export let entries: Entry[];
    export let by: By;

    let bucketSize = 60 * 60 * 24 * 7;

    let data;
    let filter = '';
    let filterCaseSensitive = false;

    function bucketiseTime (time: number, bucketSize: number): number {
        return Math.floor(time / bucketSize) * bucketSize;
    }

    function getGraphData (entries: Entry[], bucketSize: number, by: By) {
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

        const buckets: Record<number, number> = {};
        const start = bucketiseTime(sortedFilteredEntries[0].created, bucketSize);
        const end = bucketiseTime(nowS(), bucketSize) + bucketSize;
        for (let i = start; i < end; i += bucketSize) {
            buckets[i] = 0;
        }

        for (const entry of sortedFilteredEntries) {
            const bucket = bucketiseTime(entry.created, bucketSize);
            buckets[bucket] += (by === By.Entries) ? 1 : wordCount(entry.entry);
        }

        let year = moment(start * 1000).year();
        const labels = Object
            .keys(buckets)
            .map(k => parseInt(k))
            .map(k => {
                const thisYear = moment(k * 1000).year();
                if (thisYear !== year) {
                    year = thisYear;
                    return moment(k * 1000).format('Do MMM YYYY');
                }
                return moment(k * 1000).format('Do MMM');
            });

        const dataset = {
            data: Object.values(buckets),
            label: by === By.Entries ? 'Entries' : 'Words',
        };

        return {
            labels,
            datasets: [ dataset ],
        };
    }

    function reloadChart (entries, bucketSize, by) {
        data = getGraphData(entries, bucketSize, by);

        if (browser) {
            let size = Math.min(Math.max(
                Math.ceil(document.body.clientWidth * 0.005), 1), 20);
            if (bucketSize < 60 * 60 * 24 + 1) {
                size = Math.min(size, 2);
            }
            document.body.style.setProperty('--bar-width', `${size}px`);
        }
    }

    $: reloadChart(entries, bucketSize, by);

</script>

<div>
    <Bar
        {data}
        height="400"
        width={browser ? document.body.clientWidth : 1000}
    />
    <div>
        Group by
        <select
            on:change={e => bucketSize = parseInt(e.target.value)}
            value={bucketSize}
        >
            <option value={60 * 60 * 24 * 365}>Year</option>
            <option value={60 * 60 * 24 * 30}>Month</option>
            <option value={60 * 60 * 24 * 7}>Week</option>
            <option value={60 * 60 * 24}>Day</option>
        </select>
    </div>
</div>

<style lang="less">
    :global(:root) {
        --bar-width: 10px;
    }

    :global(.ct-series-a .ct-bar) {
        stroke: var(--color-primary);
        stroke-width: var(--bar-width);
    }

    :global(.ct-chart > *, .ct-chart, .ct-label, .ct-grids) {
        color: white !important;
        stroke: white;
    }

    :global(.ct-horizontal, .ct-vertical) {
        stroke: #6b6b6b;
    }

</style>