<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications';
    import type { Grouping } from '$lib/controllers/stats/stats';
    import { type StatsData } from '$lib/controllers/stats/stats';
    import { api } from '$lib/utils/apiRequest';
    import { Day } from '$lib/utils/day';
    import type { PageData } from './$types';
    import { fade } from 'svelte/transition';
    import { ANIMATION_DURATION } from '$lib/constants';
    import CommonWordsList from './CommonWordsList.svelte';
    import EntryCharts from './EntryChart.svelte';
    import EntryHeatMap from './EntryHeatMap.svelte';
    import SearchForWord from './SearchForWord.svelte';
    import StatPill from './StatPill.svelte';

    export let data: PageData;

    // TODO why does it think this could be undefined?
    $: uniqueWordCount = data.uniqueWordCount as number;

    $: earliestDay = Day.fromString(data.dayOfFirstEntry).unwrap();
    $: daysSinceFirstEntry = data.dayOfFirstEntry ? earliestDay.daysUntil(Day.today()) + 1 : null;

    const bucketisedDataCache = {} as Record<string, StatsData>;

    async function getBucketisedData(
        bucket: Grouping,
        from: Day | null = null,
        to: Day | null = null
    ): Promise<StatsData> {
        let cacheKey = `${bucket}-${to?.fmtIso()}-${from?.fmtIso()}`;
        if (bucketisedDataCache[cacheKey]) return bucketisedDataCache[cacheKey];
        const res = notify.onErr(
            await api.get('/stats', {
                grouping: bucket,
                from: from?.fmtIso() || undefined,
                to: to?.fmtIso() || undefined
            })
        );
        bucketisedDataCache[cacheKey] = res;
        return res;
    }
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
            <section class="flex flex-wrap gap-8 md:gap-x-16 container md:p-4">
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
                <StatPill value={uniqueWordCount} label="unique words" />
            </section>

            <div class="container my-4 p-4">
                {#if data.heatmapData !== null}
                    <EntryHeatMap earliestEntryDay={earliestDay} {getBucketisedData} />
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
                    <EntryCharts days={daysSinceFirstEntry} {getBucketisedData} />
                </div>
            {/if}

            <div class="container mt-4 md:px-6 md:py-4">
                <CommonWordsList {uniqueWordCount} entryCount={data.entryCount} />
            </div>
        {/if}
    </div>
</main>
