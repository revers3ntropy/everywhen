<script lang="ts">
    import { onMount } from 'svelte';
    import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import type { Entry } from '../../../lib/controllers/entry';
    import { By } from '../helpers';
    import SearchForWord from '../SearchForWord.svelte';
    import EntryBarChart from './../EntryBarChart.svelte';
    import EntryHeatMap from './../EntryHeatMap.svelte';

    let by: By = By.Words;

    export let data: App.PageData & {
        entries: (Entry & { instancesOfWord: number })[],
        entriesForBarChart: Entry[],
        wordCount: number,
        charCount: number,
        wordInstances: number,
        theWord: string,
    };

    onMount(() => document.title = 'Analytics');

</script>

<svelte:head>
    <title>Analytics</title>
    <meta content="Analytics" name="description" />
</svelte:head>

<main>
    <div class="title-line">
        <div>
            <a class="icon-button" href="/stats">
                <ArrowLeft size="40" />
            </a>
        </div>
        <div>
            <h1>
                <Counter size="40" />
                <span>'{data.theWord}'</span>
            </h1>
        </div>
        <div class="search-for-word">
            <SearchForWord value={data.theWord} />
        </div>
    </div>
    {#if data.wordInstances === 0}
        <section class="container unbordered">
            <div class="flex-center">
                <p>
                    You've never used that word before!
                    <a href="/journal">Why not try it out?</a>
                </p>
            </div>
        </section>
    {:else}
        <section class="container unbordered">
            <div class="stats">
                <div>
                    appears
                    <span>{data.wordInstances}</span>
                    times
                </div>
                <div>
                    in
                    <span>{data.entries.length}</span>
                    entries
                </div>
            </div>
        </section>

        <section class="charts">
            <div class="entry-heatmap-wrapper container">
                <EntryHeatMap {by} entries={data.entries} />
            </div>
            <div class="entry-bar-chart-wrapper container">
                <EntryBarChart {by} entries={data.entriesForBarChart} />
            </div>
        </section>
    {/if}
</main>

<style lang="less">
    @import '../../../styles/layout';
    @import '../../../styles/variables';

    .title-line {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        align-items: center;

        .search-for-word {
            text-align: right;
        }

        @media @mobile {
            margin: 1rem;
            grid-template-columns: 10px 1fr;

            .search-for-word {
                width: 100%;
                margin: .5rem;
                text-align: center;
            }
        }
    }

    h1 {
        .flex-center();
        font-size: 40px;
        margin: 0;
        padding: 0;

        span {
            margin-left: 0.5rem;
        }
    }

    .stats {
        text-align: center;
        display: flex;
        justify-content: center;
        flex-wrap: wrap;

        & > div {
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
            margin: .5em 0;
        }

        .entry-bar-chart-wrapper {
            padding-bottom: 0;
        }
    }

    .container {
        padding: 1em;
        margin: 1em;

        @media @mobile {
            padding: 0 .6rem;
            margin: 1em 0;
            border: none;
        }
    }
</style>