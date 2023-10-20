<script lang="ts">
    import { navExpanded } from '$lib/stores';
    import ToggleSwitch from 'svelte-material-icons/ToggleSwitch.svelte';
    import ToggleSwitchOff from 'svelte-material-icons/ToggleSwitchOff.svelte';
    import type { PageData } from './$types';
    import { fade } from 'svelte/transition';
    import { ANIMATION_DURATION } from '$lib/constants';
    import { By, heatMapDataFromEntries } from './helpers';
    import CommonWordsList from './CommonWordsList.svelte';
    import EntryBarChart from './EntryChart.svelte';
    import EntryHeatMap from './EntryHeatMap.svelte';
    import SearchForWord from './SearchForWord.svelte';
    import StatPill from './StatPill.svelte';

    export let data: PageData;

    let by: By = By.Entries;

    function toggleBy() {
        by = by === By.Entries ? By.Words : By.Entries;
    }
</script>

<svelte:head>
    <title>Insights</title>
</svelte:head>

<main class="md:p-4 {$navExpanded ? 'md:ml-48' : 'md:ml-16'}">
    {#if data.entryCount < 1}
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
        <div class="md:flex justify-between p-2">
            <div>
                <button
                    class="flex-center gap-1 bg-vLightAccent rounded-full px-2"
                    on:click={toggleBy}
                >
                    <span class:text-light={by !== By.Words}> By Words </span>
                    {#if by === By.Entries}
                        <ToggleSwitch size="30" />
                    {:else}
                        <ToggleSwitchOff size="30" />
                    {/if}
                    <span class:text-light={by !== By.Entries}> By Entries </span>
                </button>
            </div>
            <div class="search-for-word">
                <SearchForWord />
            </div>
        </div>

        <section>
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
                <StatPill
                    value={(data.wordCount / (data.entryCount || 1)).toFixed(1)}
                    label="words / entry"
                />
                <StatPill
                    value={(data.entryCount / Math.max(data.days / 7, 1)).toFixed(1)}
                    label="entries / week"
                    tooltip="7 would be one per day"
                />
            </div>
        </section>
        <div class="container my-4" style="padding: 1rem;">
            <EntryHeatMap {by} data={heatMapDataFromEntries(data.summaries)} />
        </div>
        {#if data.entryCount > 4}
            <div
                class="container my-4"
                style="padding: 1rem;"
                in:fade={{
                    // stop weird animation when changing buckets
                    duration: ANIMATION_DURATION,
                    delay: ANIMATION_DURATION
                }}
            >
                <EntryBarChart {by} entries={data.summaries} days={data.days} />
            </div>
        {/if}

        <section class="bg-vLightAccent rounded-lg my-4 p-4 pb-12">
            <h3 class="pb-8"> Common Words </h3>
            <CommonWordsList entryCount={data.entryCount} words={data.commonWords} />
        </section>
    {/if}
</main>

<style lang="scss">
    @import '$lib/styles/layout';

    .search-for-word {
        text-align: right;

        @media #{$mobile} {
            text-align: center;
            margin: 2rem 0 0 0;
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
