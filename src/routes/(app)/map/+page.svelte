<script lang="ts">
    import { slide } from 'svelte/transition';
    import { page } from '$app/stores';
    import DayRangeSelector from '$lib/components/ui/DayRangeSelector.svelte';
    import { Day } from '$lib/utils/day';
    import type { PageData } from './$types';
    import { enabledLocation, settingsStore } from '$lib/stores';
    import LocationDisabledBanner from './LocationDisabledBanner.svelte';
    import Mapbox from '$lib/components/map/Mapbox.svelte';
    import LocationsMenu from './LocationsMenu.svelte';
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import ChevronUp from 'svelte-material-icons/ChevronUp.svelte';
    import { notify } from '$lib/components/notifications/notifications';
    import { api } from '$lib/utils/apiRequest';
    import { getLocation, nullLocation } from '$lib/utils/geolocation';
    import { goto } from '$app/navigation';

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

    $: focusedLocation =
        $page.url.hash.length > 1
            ? data.locations.find(l => l.id === $page.url.hash.slice(1)) ?? null
            : null;

    let locationsMenuOpen = true;

    async function createLocation() {
        const currentLocation = $enabledLocation ? await getLocation() : nullLocation();
        const { id } = notify.onErr(
            await api.post('/locations', {
                latitude: currentLocation[0] ?? 0,
                longitude: currentLocation[1] ?? 0,
                radius: 0.1,
                name: 'New Location'
            })
        );
        await goto(`/map/${id}`);
    }
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
            {#if focusedLocation}
                <Mapbox
                    entries={showedEntries}
                    locations={data.locations}
                    defaultZoom={0}
                    bounds={[
                        {
                            lat: focusedLocation.latitude + focusedLocation.radius * 1.2,
                            lng: focusedLocation.longitude - focusedLocation.radius * 1.2
                        },
                        {
                            lat: focusedLocation.latitude - focusedLocation.radius * 1.2,
                            lng: focusedLocation.longitude + focusedLocation.radius * 1.2
                        }
                    ]}
                />
            {:else}
                <Mapbox entries={showedEntries} locations={data.locations} defaultZoom={0} />
            {/if}

            <div class="fixed top-2 right-2" data-theme="light">
                <div class="rounded-xl bg-backgroundColor" class:pb-4={locationsMenuOpen}>
                    <div class="flex">
                        <DayRangeSelector bind:dateRange {earliestDate} />
                        <button
                            on:click={() => (locationsMenuOpen = !locationsMenuOpen)}
                            class="px-2"
                        >
                            {#if locationsMenuOpen}
                                <ChevronUp />
                            {:else}
                                <ChevronDown />
                            {/if}
                        </button>
                    </div>

                    {#if locationsMenuOpen}
                        <div transition:slide={{}}>
                            <LocationsMenu locations={data.locations} {createLocation} />
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </section>
</main>
