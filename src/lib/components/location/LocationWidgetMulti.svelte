<script lang="ts">
    import { uniqueByKey } from '$lib/utils.js';
    import MapMarker from 'svelte-material-icons/MapMarkerOutline.svelte';
    import { Location } from '$lib/controllers/location/location';

    export let obfuscated = false;
    export let locations: Location[];
    export let latitudes: number[];
    export let longitudes: number[];

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
        <span class="flex-center">
            <MapMarker size="20" />
        </span>

        <span>
            {#each touchingLocations as location, i}
                <a href="/map/{location.id}" class="ellipsis" class:obfuscated>
                    {location.name}{#if i < touchingLocations.length - 1},{/if}
                </a>
            {/each}
        </span>
    </span>
{/if}
