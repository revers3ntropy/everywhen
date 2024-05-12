<script lang="ts">
    import { goto } from '$app/navigation';
    import EditLocation from '$lib/components/location/EditLocation.svelte';
    import Entries from '$lib/components/entry/Entries.svelte';
    import type { Location } from '$lib/controllers/location/location';
    import type { PageData } from './$types';

    export let data: PageData;

    async function onChange(newLocation: Location | null): Promise<void> {
        if (newLocation === null) {
            await goto('/map');
        }
    }
</script>

<svelte:head>
    <title>{data.location.name} | Location</title>
</svelte:head>
<main class="p-4 md:ml-[10.5rem]">
    <section class="p-2 md:rounded-lg md:bg-vLightAccent md:p-4">
        <EditLocation {...data.location} {onChange} />
    </section>

    <section class="pt-4">
        <Entries
            options={{
                locationId: data.location.id
            }}
            showLabels
            locations={data.locations}
            labels={data.labels}
        />
    </section>
</main>
