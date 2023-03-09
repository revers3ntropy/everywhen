<script lang="ts">
    import type { App } from '../../app';
    import { Entry } from '../../lib/controllers/entry';
    import EntryBarChart from './EntryBarChart.svelte';
    import EntryHeatMap from './EntryHeatMap.svelte';
    import { By } from './helpers';

    let by: By = By.Entries;

    export let data: App.PageData & {
        entries: Entry[],
        entryCount: number,
        wordCount: number,
        charCount: number,
    };
</script>

<main>
    <h1>{data.entryCount} Entries</h1>

    <section class="stats">
        <div>
            <span>{data.wordCount}</span>
            Words
        </div>
        <div>
            <span>{data.charCount}</span>
            Characters
        </div>
        <div>
            <span>{Math.round(data.wordCount / data.entryCount)}</span>
            Words/Entry
        </div>
        <div>
            <span>{Math.round(data.charCount / data.wordCount)}</span>
            Characters/Word
        </div>
    </section>

    <section class="charts">
        <div class="entry-bar-chart-wrapper">
            <EntryBarChart {by} entries={data.entries} />
        </div>
        <div class="entry-heatmap-wrapper">
            <EntryHeatMap {by} entries={data.entries} />
        </div>
    </section>
</main>

<style lang="less">
    @import '../../styles/variables.less';

    .stats {
        text-align: center;
        display: flex;
        justify-content: center;
        flex-wrap: wrap;

        div {
            background: @light-accent;
            padding: 0.3rem;
            border-radius: 0.5rem;
            margin: 0.5rem;
            font-size: 0.90rem;

            span {
                font-weight: bold;
                font-size: 1rem;
            }
        }
    }

    .charts {
        & > * {
            margin: 2em 0.5em;
        }
    }
</style>