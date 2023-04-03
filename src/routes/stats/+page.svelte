<script lang="ts">
    // @ts-ignore
    import { tooltip } from '@svelte-plugins/tooltips';
    import { onMount } from 'svelte';
    import type { App } from '../../app';
    import type { Entry } from '../../lib/controllers/entry';
    import CommonWordsList from './CommoWordsList.svelte';
    import EntryBarChart from './EntryBarChart.svelte';
    import EntryHeatMap from './EntryHeatMap.svelte';
    import { By } from './helpers';

    let by: By = By.Entries;

    export let data: App.PageData & {
        entries: Entry[],
        entryCount: number,
        wordCount: number,
        charCount: number,
        commonWords: [ string, number ][],
        days: number,
    };

    onMount(() => document.title = 'Analytics');

    function round1DP (num: number) {
        return Math.round(num * 10) / 10;
    }

</script>

<svelte:head>
    <title>Analytics</title>
    <meta content="Analytics" name="description" />
</svelte:head>

<main>
    {#if data.entries.length === 0}
        <section class="container unbordered">
            <h1>No Entries</h1>
            <div class="flex-center">
                <p>
                    You need to create some entries before you can see Stats.
                    <a href="/diary">Create one!</a>
                </p>
            </div>
        </section>
    {:else}
        <section class="container unbordered">
            <h1>{data.entryCount} Entries</h1>
            <div class="stats">
                <div
                    use:tooltip={{
                        content: "A typical novel is 100,000 words"
                    }}
                >
                    <span>{data.wordCount}</span>
                    Words
                </div>
                <div>
                    <span>{data.charCount}</span>
                    Characters
                </div>
                <div>
                    <span>{round1DP(data.wordCount / (data.entryCount || 1))}</span>
                    Words/Entry
                </div>
                <div
                    use:tooltip={{
                        content: "The average English word is 4.7 letters long"
                    }}
                >
                    <span>{round1DP(data.charCount / (data.wordCount || 1))}</span>
                    Letters/Word
                </div>
                <div>
                    <span>{round1DP(data.wordCount / data.days)}</span>
                    Words/Day
                </div>
                <div>
                    <span>{round1DP(data.entryCount / Math.max(data.days / 7, 1))}</span>
                    Entries/Week
                </div>
            </div>
        </section>

        <section class="charts">
            <div class="entry-bar-chart-wrapper container">
                <EntryBarChart {by} entries={data.entries} />
            </div>
            <div class="entry-heatmap-wrapper container">
                <EntryHeatMap {by} entries={data.entries} />
            </div>
        </section>

        <section class="container">
            <CommonWordsList
                entryCount={data.entryCount}
                words={data.commonWords}
            />
        </section>
    {/if}
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