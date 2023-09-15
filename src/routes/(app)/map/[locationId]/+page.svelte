<script lang="ts">
    import { goto } from '$app/navigation';
    import EditLocation from '$lib/components/location/EditLocation.svelte';
    import Entries from '$lib/components/entry/Entries.svelte';
    import type { Location } from '$lib/controllers/location/location';
    import { navExpanded } from '$lib/stores';
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
<main class="p-4 {$navExpanded ? 'md:ml-48' : 'md:ml-16'}">
    <section class="p-2 md:rounded-lg md:bg-vLightAccent md:p-4">
        <EditLocation {...location} {onChange} />
    </section>

    <section class="pt-4">
        <Entries
            options={{
                locationId: location.id
            }}
            showLabels
            {locations}
        />
    </section>
</main>
