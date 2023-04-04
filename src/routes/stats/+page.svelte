<script lang="ts">
    // @ts-ignore
    import { tooltip } from '@svelte-plugins/tooltips';
    import { onMount } from 'svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import type { ChangeEventHandler } from 'svelte/elements';
    import type { Entry } from '../../lib/controllers/entry';
    import { round1DP } from '../../lib/utils/text';
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

    const searchWordChange = (e => {
        location.assign(`/stats/${(e.target as HTMLInputElement).value}`);
    }) satisfies ChangeEventHandler<HTMLInputElement>;

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
                    You need to create some entries before you can see analytics,
                    <a href="/journal">why not create one?</a>
                </p>
            </div>
        </section>
    {:else}

        <div class="title-line">
            <div></div>
            <div>
                <h1>
                    <Counter size="40" />
                    <span>Analytics</span>
                </h1>
            </div>
            <div class="search-for-word">
                <input
                    on:change={searchWordChange}
                    value=""
                    placeholder="Search for word..."
                >
            </div>
        </div>

        <section class="container unbordered">
            <div class="stats">
                <div>
                    <span>{data.entryCount}</span>
                    entries
                </div>
                <div
                    use:tooltip={{
                        content: "A typical novel is 100,000 words"
                    }}
                >
                    <span>{data.wordCount}</span>
                    words
                </div>
                <div>
                    <span>{data.charCount}</span>
                    characters
                </div>
                <div>
                    <span>{round1DP(data.wordCount / (data.entryCount || 1))}</span>
                    words / entry
                </div>
                <div
                    use:tooltip={{
                        content: "The average English word is 4.7 letters long"
                    }}
                >
                    <span>{round1DP(data.charCount / (data.wordCount || 1))}</span>
                    letters / word
                </div>
                <div>
                    <span>{round1DP(data.wordCount / data.days)}</span>
                    words / day
                </div>
                <div>
                    <span>{round1DP(data.entryCount / Math.max(data.days / 7, 1))}</span>
                    entries / week
                </div>
            </div>
        </section>

        <section class="charts">
            <div class="entry-heatmap-wrapper container">
                <EntryHeatMap {by} entries={data.entries} />
            </div>
            {#if data.entryCount > 4}
                <div class="entry-bar-chart-wrapper container">
                    <EntryBarChart {by} entries={data.entries} />
                </div>
            {/if}
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
    @import '../../styles/layout';
    @import '../../styles/variables';

    .title-line {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        align-items: center;

        .search-for-word {
            text-align: right;
        }

        @media @mobile {
            display: block;

            & > * {
                margin: 0.5rem 0;
            }

            .search-for-word {
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