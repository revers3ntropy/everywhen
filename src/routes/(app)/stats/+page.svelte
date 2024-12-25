<script lang="ts">
    import { Day } from '$lib/utils/day';
    import type { PageData } from './$types';
    import { fade } from 'svelte/transition';
    import { ANIMATION_DURATION } from '$lib/constants';
    import { Bucket } from './helpers';
    import EntryCharts from './EntryChart.svelte';
    import EntryHeatMap from './EntryHeatMap.svelte';
    import SearchForWord from './SearchForWord.svelte';
    import StatPill from './StatPill.svelte';

    export let data: PageData;

    $: console.log(data);

    $: daysSinceFirstEntry = data.dayOfFirstEntry
        ? Day.fromString(data.dayOfFirstEntry).unwrap().daysUntil(Day.today()) + 1
        : null;
</script>

<svelte:head>
    <title>Insights</title>
</svelte:head>

<main class="md:p-4 md:pl-4 flex-center">
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
            <div class="pb-4">
                <SearchForWord />
            </div>

            <section class="flex flex-wrap gap-8 container md:p-4">
                <StatPill value={data.entryCount} label="entries" />
                <StatPill value={daysSinceFirstEntry} label="days" />
                <StatPill value={data.wordCount} label="words" />
                <StatPill
                    value={(data.wordCount / daysSinceFirstEntry).toFixed(1)}
                    label="words / day"
                />
                <StatPill
                    value={(data.wordCount / (data.entryCount || 1)).toFixed(1)}
                    label="words / entry"
                />
                <StatPill
                    value={(data.entryCount / Math.max(daysSinceFirstEntry / 7, 1)).toFixed(1)}
                    label="entries / week"
                />
            </section>

            <div class="container my-4 p-4">
                {#if data.heatmapData !== null}
                    <EntryHeatMap
                        data={data.heatmapData}
                        earliestEntryDay={Day.fromString(data.dayOfFirstEntry).unwrap()}
                    />
                {/if}
            </div>

            {#if data.entryCount > 4}
                <div
                    class="container"
                    style="padding: 0 0 0.5rem 0"
                    in:fade={{
                        // stop weird animation when changing buckets
                        duration: ANIMATION_DURATION,
                        delay: ANIMATION_DURATION
                    }}
                >
                    <EntryCharts
                        days={daysSinceFirstEntry}
                        timeOfDayData={data.timeOfDayData}
                        entriesByDayOfWeek={data.entriesByDayOfWeek}
                        earliestEntryDay={Day.fromString(data.dayOfFirstEntry).unwrap()}
                        bucketisedData={{
                            [Bucket.Year]: data.entriesByYear,
                            [Bucket.Month]: data.entriesByMonth
                        }}
                    />
                </div>
            {/if}
        {/if}
    </div>
</main>
