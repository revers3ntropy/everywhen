<script lang="ts">
    import { Day } from '$lib/utils/day';
    import { onMount } from 'svelte';
    import ToggleSwitch from 'svelte-material-icons/ToggleSwitch.svelte';
    import ToggleSwitchOff from 'svelte-material-icons/ToggleSwitchOff.svelte';
    import type { PageData } from './$types';
    import { fade } from 'svelte/transition';
    import { ANIMATION_DURATION } from '$lib/constants';
    import { By, type HeatMapData, heatMapDataFromEntries } from './helpers';
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

    $: daysSinceFirstEntry = data.dayOfFirstEntry
        ? Day.fromString(data.dayOfFirstEntry).unwrap().daysUntil(Day.today()) + 1
        : null;

    let heatMapData: Record<By, HeatMapData> | null = null;
    onMount(() => {
        // does not scale well, will be slow with lots of entries
        heatMapData = heatMapDataFromEntries(data.summaries);
    });
</script>

<svelte:head>
    <title>Insights</title>
</svelte:head>

<main class="md:p-4 md:ml-[10.5rem] flex-center">
    <div class="w-full md:max-w-5xl">
        {#if data.entryCount < 1}
            <section>
                <h1 class="flex-center"> No Entries </h1>
                <div class="flex-center pt-4">
                    <p>
                        You need to create some entries before you can see insights,
                        <a href="/journal"> why not create one? </a>
                    </p>
                </div>
            </section>
        {:else if daysSinceFirstEntry === null || data.dayOfFirstEntry === null}
            Something went wrong, please try again later
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
                <div class="flex justify-end">
                    <SearchForWord />
                </div>
            </div>

            <section class="flex flex-wrap gap-8 container md:p-4">
                <StatPill value={data.entryCount} label="entries" />
                <StatPill value={daysSinceFirstEntry} label="days" />
                <StatPill
                    value={data.wordCount}
                    label="words"
                    tooltip="A typical novel is 100,000 words"
                />
                <StatPill
                    value={(data.wordCount / daysSinceFirstEntry).toFixed(1)}
                    label="words / day"
                    tooltip="People typically speak about {(7000).toLocaleString()} words per day"
                />
                <StatPill
                    value={(data.wordCount / (data.entryCount || 1)).toFixed(1)}
                    label="words / entry"
                />
                <StatPill
                    value={(data.entryCount / Math.max(daysSinceFirstEntry / 7, 1)).toFixed(1)}
                    label="entries / week"
                    tooltip="7 would be one per day"
                />
            </section>

            <div class="container my-4 p-4">
                {#if heatMapData !== null}
                    <EntryHeatMap
                        {by}
                        data={heatMapData}
                        earliestEntryDay={Day.fromString(data.dayOfFirstEntry).unwrap()}
                    />
                {/if}
            </div>

            {#if data.entryCount > 4}
                <div
                    class="container my-4 p-4"
                    in:fade={{
                        // stop weird animation when changing buckets
                        duration: ANIMATION_DURATION,
                        delay: ANIMATION_DURATION
                    }}
                >
                    <EntryBarChart {by} entries={data.summaries} days={daysSinceFirstEntry} />
                </div>
            {/if}

            <section class="container my-4 p-4 pb-12">
                <h3 class="pb-8"> Common Words </h3>
                <CommonWordsList entryCount={data.entryCount} words={data.commonWords} />
            </section>
        {/if}
    </div>
</main>
