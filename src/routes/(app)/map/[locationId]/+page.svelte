<script lang="ts">
    import { goto } from '$app/navigation';
    import EditLocation from '$lib/components/location/EditLocation.svelte';
    import Entries from '$lib/components/entry/Entries.svelte';
    import type { Location } from '$lib/controllers/location/location';
    import type { PageData } from './$types';

    export let data: PageData;
    const { location, locations } = data;

    async function onChange(newLocation: Location | null): Promise<void> {
        if (newLocation === null) {
            await goto('/map');
        }
    }
</script>

<svelte:head>
    <title>{location.name} | Location</title>
</svelte:head>

<section class="container">
    <EditLocation {...location} {onChange} />
</section>

<section>
    <Entries
        options={{
            locationId: location.id
        }}
        showLabels
        {locations}
    />
</section>

<style lang="scss">
</style>
