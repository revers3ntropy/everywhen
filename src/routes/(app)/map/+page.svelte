<script lang="ts">
    import DayRangeSelector from '$lib/components/ui/DayRangeSelector.svelte';
    import { Day } from '$lib/utils/day';
    import type { PageData } from './$types';
    import { enabledLocation, settingsStore } from '$lib/stores';
    import LocationDisabledBanner from './LocationDisabledBanner.svelte';
    import Mapbox from '$lib/components/map/Mapbox.svelte';

    export let data: PageData;

    const earliestDate = data.entries.reduce((acc, entry) => {
        const entryDay = Day.fromTimestamp(entry.created, entry.createdTzOffset);
        return acc.lte(entryDay) ? acc : entryDay;
    }, Day.todayUsingNativeDate());

    let dateRange: [Day, Day] = [
        Day.todayUsingNativeDate().plusMonths(-1),
        Day.todayUsingNativeDate()
    ];
    $: showedEntries = data.entries.filter(entry => {
        const entryDay = Day.fromTimestamp(entry.created, entry.createdTzOffset);
        return dateRange[0].lte(entryDay) && dateRange[1].gte(entryDay);
    });
</script>

<svelte:head>
    <title>Map</title>
</svelte:head>

<main>
    <section>
        {#if !$settingsStore.preferLocationOn.value || !$enabledLocation}
            <LocationDisabledBanner />
        {/if}
        <div class="fixed top-0 left-0 md:left-[192px] h-screen w-full">
            <Mapbox entries={showedEntries} locations={data.locations} defaultZoom={0} />

            <div class="fixed top-2 right-12" data-theme="light">
                <DayRangeSelector bind:dateRange {earliestDate} />
            </div>
        </div>
    </section>
</main>
