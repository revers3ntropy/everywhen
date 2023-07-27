<script lang="ts">
    import Map from '$lib/components/map/Map.svelte';
    import type { PageData } from './$types';
    import { enabledLocation } from '$lib/stores';
    import LocationDisabledBanner from './LocationDisabledBanner.svelte';

    export let data: PageData;
</script>

<svelte:head>
    <title>Map</title>
</svelte:head>

<main>
    <section>
        {#if !data.settings.preferLocationOn.value || !$enabledLocation}
            <LocationDisabledBanner
                auth={data.auth}
                preferOn={data.settings.preferLocationOn.value}
            />
        {/if}
        <Map
            auth={data.auth}
            entries={data.entries}
            locations={data.locations}
            hideAgentWidget={!data.settings.showAgentWidgetOnEntries.value}
            showArrowsBetweenEntriesOnMap={data.settings.showArrowsBetweenEntriesOnMap.value}
        />
    </section>
</main>
