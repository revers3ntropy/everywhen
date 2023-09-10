<script lang="ts">
    import type { PageData } from './$types';
    import { fade } from 'svelte/transition';
    import { ANIMATION_DURATION } from '$lib/constants';
    import { By } from './helpers';
    import Counter from 'svelte-material-icons/Counter.svelte';
    import CommonWordsList from './CommonWordsList.svelte';
    import EntryBarChart from './EntryChart.svelte';
    import EntryHeatMap from './EntryHeatMap.svelte';
    import SearchForWord from './SearchForWord.svelte';
    import StatPill from './StatPill.svelte';

    export let data: PageData;
    let { entries, entryCount, days, charCount, wordCount, commonWords } = data;

    let by: By = By.Entries;
</script>

<svelte:head>
    <title>Insights</title>
</svelte:head>

<main>
    {#if entries.length === 0}
        <section>
            <h1> No Entries </h1>
            <div class="flex-center" style="padding-top: 1rem">
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
                <SearchForWord />
            </div>
        </div>

        <section class="container invisible">
            <div class="stats">
                <StatPill primary value={entryCount} label="entries" />
                <StatPill primary value={days} label="days" />
                <StatPill
                    primary
                    value={wordCount}
                    label="words"
                    tooltip="A typical novel is 100,000 words"
                />
                <StatPill
                    value={(wordCount / days).toFixed(1)}
                    label="words / day"
                    tooltip="People typically speak about {(7000).toLocaleString()} words per day"
                />
                <StatPill value={charCount} label="characters" />
                <StatPill
                    value={(wordCount / (entryCount || 1)).toFixed(1)}
                    label="words / entry"
                />
                <StatPill
                    value={(charCount / (wordCount || 1)).toFixed(1)}
                    label="letters / word"
                    tooltip="The average English word is 4.7 letters long"
                />
                <StatPill
                    value={(entryCount / Math.max(days / 7, 1)).toFixed(1)}
                    label="entries / week"
                    tooltip="7 would be one per day"
                />
            </div>
        </section>

        <div class="container" style="padding: 1rem;">
            <EntryHeatMap {by} {entries} />
        </div>
        {#if entryCount > 4}
            <div
                class="container"
                style="padding: 1rem;"
                in:fade={{
                    // stop weird animation when changing buckets
                    duration: ANIMATION_DURATION,
                    delay: ANIMATION_DURATION
                }}
            >
                <EntryBarChart {by} {entries} {days} />
            </div>
        {/if}

        <section class="container" style="padding: 1rem 1rem 3rem 1rem;">
            <h3 style="padding: 0 0 2rem 0"> Common Words </h3>
            <CommonWordsList {entryCount} words={commonWords} />
        </section>
    {/if}
</main>

<style lang="scss">
    @import '$lib/styles/layout';

    .title-line {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        align-items: center;

        .search-for-word {
            text-align: right;

            @media #{$mobile} {
                text-align: center;
                margin: 2rem 0 0 0;
            }
        }

        @media #{$mobile} {
            display: block;

            & > * {
                margin: 0.5rem 0;
            }
        }
    }

    h1 {
        @extend .flex-center;
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
</style>
