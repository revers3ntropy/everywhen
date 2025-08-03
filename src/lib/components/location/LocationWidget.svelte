<script context="module" lang="ts">
    import type { AddressLookupResults } from '$lib/controllers/location/location';
    import { api } from '$lib/utils/apiRequest';
    import type { Degrees } from '../../../types';

    const addressLookupCache: Map<string, AddressLookupResults | null> = new Map();

    async function lookupAddress(lat: Degrees, lon: Degrees): Promise<AddressLookupResults | null> {
        const key = `${lat}#${lon}`;
        if (addressLookupCache.has(key)) return addressLookupCache.get(key)!;

        const res = await api.get('/locations/reverse-geocode', { lat, lon });
        if (!res.ok) {
            addressLookupCache.set(key, null);
            return null;
        }
        addressLookupCache.set(key, res.val);
        return res.val;
    }
</script>

<script lang="ts">
    import ChevronDown from 'svelte-material-icons/ChevronDown.svelte';
    import ChevronUp from 'svelte-material-icons/ChevronUp.svelte';
    import MapMarker from 'svelte-material-icons/MapMarkerOutline.svelte';
    import { Location } from '$lib/controllers/location/location';
    import { browser } from '$app/environment';

    export let obfuscated = false;
    export let locations: Location[];
    export let latitude: number;
    export let longitude: number;
    export let showingMap: boolean;

    const { near, touching } = Location.filterLocationsByPoint(locations, {
        latitude,
        longitude
    });

    $: lookedupAddress =
        near.length > 0 || touching.length > 0 || !browser
            ? null
            : lookupAddress(latitude, longitude);
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
    {:else if lookedupAddress}
        {#await lookedupAddress}
            ?
        {:then addr}
            {#if addr}
                <span class="text-light italic">
                    {addr.place},
                    {addr.country}
                </span>
            {/if}
        {/await}
    {/if}
</span>
