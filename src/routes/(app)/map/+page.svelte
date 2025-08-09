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
    import { listen } from '$lib/dataChangeEvents';
    import { tryEncryptText } from '$lib/utils/encryption.client';

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
                name: tryEncryptText('New Location')
            })
        );
        await goto(`/map/${id}`);
    }

    listen.location.onDelete(id => {
        data.locations = data.locations.filter(l => l.id !== id);
    });
    listen.location.onCreate(location => {
        data.locations = [location, ...data.locations];
    });
    listen.location.onUpdate(location => {
        data.locations = data.locations.map(l => (l.id === location.id ? location : l));
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
            {:else if $enabledLocation}
                {#await getLocation()}
                    Loading...
                {:then [lat, lon]}
                    <Mapbox
                        entries={showedEntries}
                        locations={data.locations}
                        defaultZoom={15}
                        defaultCenter={{ lat: lat ?? 0, lon: lon ?? 0 }}
                    />
                {/await}
            {:else}
                <Mapbox entries={showedEntries} locations={data.locations} defaultZoom={0} />
            {/if}

            <div class="fixed top-2 right-2">
                <div class="rounded-xl bg-backgroundColor border-border border">
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
