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
    import EncryptedText from '$lib/components/ui/EncryptedText.svelte';

    export let obfuscated = false;
    export let locations: Location[];
    export let latitude: number;
    export let longitude: number;
    export let showingMap: boolean;
    export let noLink = false;
    export let fullAddress = false;
    export let noChevron = false;

    const { near, touching } = Location.filterLocationsByPoint(locations, {
        latitude,
        longitude
    });

    $: lookedupAddress =
        near.length > 0 || touching.length > 0 || !browser
            ? null
            : lookupAddress(latitude, longitude);
</script>

<span class="flex items-center max-w-full text-sm oneline">
    <span class="flex-center">
        <MapMarker size="20" />
        {#if !noChevron}
            {#if showingMap}
                <ChevronUp size="15" />
            {:else}
                <ChevronDown size="15" />
            {/if}
        {/if}
    </span>
    {#if touching.length}
        <span>
            {#if noLink}
                <EncryptedText text={touching[0].name} {obfuscated} />
            {:else}
                <a href="/map/{touching[0].id}" class="ellipsis">
                    <EncryptedText text={touching[0].name} {obfuscated} />
                </a>
            {/if}
        </span>
    {:else if near && near?.length}
        <span class="flex-center ellipsis" style="gap: 0.2rem">
            <span class="text-light"> near </span>
            {#if noLink}
                <EncryptedText text={near[0].name} {obfuscated} />
            {:else}
                <a href="/map/{near[0].id}" class="ellipsis">
                    <EncryptedText text={near[0].name} {obfuscated} />
                </a>
            {/if}
        </span>
    {:else if lookedupAddress}
        {#await lookedupAddress}
            ?
        {:then addr}
            {#if addr}
                {#if fullAddress}
                    <span class="text-light italic">
                        {#if addr.number}
                            {addr.number}
                        {/if}
                        {#if addr.street}
                            {addr.street},
                        {/if}
                        {addr.place},
                        {addr.postcode},
                        {addr.country}
                    </span>
                {:else}
                    <span class="text-light italic">
                        {addr.place},
                        {addr.country}
                    </span>
                {/if}
            {/if}
        {/await}
    {/if}
</span>
