<script lang="ts">
    import Map from '$lib/components/map/Map.svelte';
    import type { PageData } from './$types';
    import { enabledLocation, settingsStore } from '$lib/stores';
    import LocationDisabledBanner from './LocationDisabledBanner.svelte';

    export let data: PageData;
</script>

<svelte:head>
    <title>Map</title>
</svelte:head>

<main>
    <section>
        {#if !$settingsStore.preferLocationOn.value || !$enabledLocation}
            <LocationDisabledBanner />
        {/if}
        <Map entries={data.entries} locations={data.locations} />
    </section>
</main>
