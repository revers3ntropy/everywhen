<script lang="ts">
    import { ANIMATION_DURATION } from '$lib/constants';
    import { onMount } from 'svelte';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import CommonWordsList from './CommonWordsList.svelte';
    import EntryBarChart from './EntryBarChart.svelte';
    import EntryHeatMap from './EntryHeatMap.svelte';
    import { By } from './helpers';
    import SearchForWord from './SearchForWord.svelte';
    import StatPill from './StatPill.svelte';
    import { fade } from 'svelte/transition';
    import type { PageData } from './$types';

    let by: By = By.Entries;

    export let data: PageData;

    onMount(() => (document.title = 'Insights'));
</script>

<svelte:head>
    <title>Insights</title>
    <meta content="Insights" name="description" />
</svelte:head>

<main>
    {#if data.entries.length === 0}
        <section class="container invisible">
            <h1> No Entries </h1>
            <div class="flex-center">
                <p>
                    You need to create some entries before you can see insights,
                    <a href="/journal"> why not create one? </a>
                </p>
            </div>
        </section>
    {:else}
        <div class="title-line">
            <div />
            <div>
                <h1>
                    <Counter size="40" />
                    <span> Insights </span>
                </h1>
            </div>
            <div class="search-for-word">
                <SearchForWord auth={data.auth} />
            </div>
        </div>

        <section class="container invisible">
            <div class="stats">
                <StatPill primary value={data.entryCount} label="entries" />
                <StatPill primary value={data.days} label="days" />
                <StatPill
                    primary
                    value={data.wordCount}
                    label="words"
                    tooltip="A typical novel is 100,000 words"
                />
                <StatPill
                    value={(data.wordCount / data.days).toFixed(1)}
                    label="words / day"
                    tooltip="People typically speak about {(7000).toLocaleString()} words per day"
                />
                <StatPill value={data.charCount} label="characters" />
                <StatPill
                    value={(data.wordCount / (data.entryCount || 1)).toFixed(1)}
                    label="words / entry"
                />
                <StatPill
                    value={(data.charCount / (data.wordCount || 1)).toFixed(1)}
                    label="letters / word"
                    tooltip="The average English word is 4.7 letters long"
                />
                <StatPill
                    value={(data.entryCount / Math.max(data.days / 7, 1)).toFixed(1)}
                    label="entries / week"
                    tooltip="7 would be one per day"
                />
            </div>
        </section>

        <section class="charts">
            <div class="entry-heatmap-wrapper">
                <EntryHeatMap {by} entries={data.entries} />
            </div>
            {#if data.entryCount > 4}
                <div
                    class="entry-bar-chart-wrapper"
                    in:fade={{
                        // stop weird animation when changing buckets
                        duration: ANIMATION_DURATION,
                        delay: ANIMATION_DURATION
                    }}
                >
                    <EntryBarChart {by} entries={data.entries} days={data.days} />
                </div>
            {/if}
        </section>

        <section>
            <h2> Common Words </h2>
            <CommonWordsList
                entryCount={data.entryCount}
                words={data.commonWords}
                auth={data.auth}
            />
        </section>
    {/if}
</main>

<style lang="less">
    @import '../../../styles/layout';
    @import '../../../styles/variables';

    h2 {
        margin: 2rem 0 1rem 0;
    }

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
    }

    .charts {
        & > * {
            margin: 0.5em 0;
        }

        .entry-bar-chart-wrapper {
            padding: 5rem 0;
        }
    }

    .container {
        padding: 1em;
        margin: 1em;

        @media @mobile {
            padding: 0 0.6rem;
            margin: 1em 0;
            border: none;
        }
    }
</style>
