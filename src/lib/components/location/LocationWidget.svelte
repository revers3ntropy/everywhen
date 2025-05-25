<script lang="ts">
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import ChevronUp from 'svelte-material-icons/ChevronUp.svelte';
    import MapMarker from 'svelte-material-icons/MapMarkerOutline.svelte';
    import { Location } from '$lib/controllers/location/location';

    export let obfuscated = false;
    export let locations: Location[];
    export let latitude: number;
    export let longitude: number;
    export let showingMap: boolean;

    const { near, touching } = Location.filterLocationsByPoint(locations, {
        latitude,
        longitude
    });
</script>

<span class="flex items-center max-w-full text-sm">
    <span class="flex-center">
        <MapMarker size="20" />
        {#if showingMap}
            <ChevronUp size="15" />
        {:else}
            <ChevronDown size="15" />
        {/if}
    </span>
    {#if touching.length}
        <span>
            <a href="/map/{touching[0].id}" class="ellipsis" class:obfuscated>
                {touching[0].name}
            </a>
        </span>
    {:else if near && near?.length}
        <span class="flex-center ellipsis" style="gap: 0.2rem">
            <span class="text-light"> near </span>
            <a href="/map/{near[0].id}" class="ellipsis" class:obfuscated>
                {near[0].name}
            </a>
        </span>
    {/if}
</span>
