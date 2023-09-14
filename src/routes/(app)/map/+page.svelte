<script lang="ts">
    import Map from '$lib/components/map/Map.svelte';
    import type { PageData } from './$types';
    import { enabledLocation, settingsStore } from '$lib/stores';
    import LocationDisabledBanner from './LocationDisabledBanner.svelte';

    export let data: PageData;
    let { entries, locations } = data;
</script>

<svelte:head>
    <title>Map</title>
</svelte:head>

<main>
    <section>
        {#if !$settingsStore.preferLocationOn.value || !$enabledLocation}
            <LocationDisabledBanner />
        {/if}
        <div class="fixed top-0 left-0 h-screen w-full">
            <Map {entries} {locations} />
        </div>
    </section>
</main>
