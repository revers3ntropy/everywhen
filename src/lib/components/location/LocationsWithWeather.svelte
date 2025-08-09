<script lang="ts">
    import { uniqueByKey } from '$lib/utils.js';
    import MapMarker from 'svelte-material-icons/MapMarkerOutline.svelte';
    import { Location } from '$lib/controllers/location/location';
    import type { OpenWeatherMapAPI } from '$lib/controllers/openWeatherMapAPI/openWeatherMapAPI';
    import type { Day } from '$lib/utils/day';
    import WeatherWidget from '$lib/components/weather/WeatherWidget.svelte';
    import WeatherDialog from '$lib/components/dataset/WeatherDialog.svelte';
    import * as Popover from '$lib/components/ui/popover';
    import EncryptedText from '$lib/components/ui/EncryptedText.svelte';

    export let obfuscated = false;
    export let locations: Location[];
    export let latitudes: number[];
    export let longitudes: number[];
    export let dayOfWeather: Day;
    export let getWeather: (location: Location) => Promise<OpenWeatherMapAPI.WeatherForDay | null>;

    $: touchingLocations = uniqueByKey(
        latitudes
            .map(
                (latitude, i) =>
                    Location.filterLocationsByPoint(locations, {
                        latitude,
                        longitude: longitudes[i]
                    }).touching?.[0]
            )
            .filter(Boolean),
        l => l.id
    );
</script>

{#if touchingLocations.length}
    <span class="flex items-center max-w-full text-sm">
        <span class="flex gap-2 pl-1">
            {#each touchingLocations as location}
                <span class="bg-lightAccent pl-2 rounded-full flex items-center">
                    <span class="flex-center">
                        <MapMarker size="20" />
                    </span>
                    <a href="/map/{location.id}" class="ellipsis pl-1" class:obfuscated>
                        <EncryptedText text={location.name} />
                    </a>
                    {#await getWeather(location)}
                        <span class="w-[4.5rem] h-8 flex-center"> ? </span>
                    {:then weather}
                        {#if weather}
                            <Popover.Root>
                                <Popover.Trigger
                                    class="hover:bg-backgroundColor rounded-full px-3 py-1"
                                >
                                    <WeatherWidget {weather} />
                                </Popover.Trigger>
                                <Popover.Content>
                                    <WeatherDialog day={dayOfWeather} {weather} />
                                </Popover.Content>
                            </Popover.Root>
                        {:else}
                            <span class="h-[28px] w-4" />
                        {/if}
                    {/await}
                </span>
            {/each}
        </span>
    </span>
{/if}
