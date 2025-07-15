<script lang="ts">
    import { goto } from '$app/navigation';
    import EditLocation from '$lib/components/location/EditLocation.svelte';
    import Entries from '$lib/components/entry/Entries.svelte';
    import { listen } from '$lib/dataChangeEvents';
    import type { PageData } from './$types';
    import Mapbox from '$lib/components/map/Mapbox.svelte';

    export let data: PageData;

    listen.location.onDelete(async id => {
        if (data.location.id === id) {
            await goto('/map');
        }
    });
</script>

<svelte:head>
    <title>{data.location.name} | Location</title>
</svelte:head>
<main class="md:p-4 md:pl-4 flex-center">
    <div class="w-full md:max-w-5xl">
        <section class="p-2 md:rounded-lg md:bg-vLightAccent md:p-4">
            <EditLocation {...data.location} />
        </section>

        <div class="h-[300px] md:rounded-lg py-4">
            <Mapbox locations={[data.location]} locationsAreEditable />
        </div>

        <section class="pt-4 md:pl-2">
            <Entries
                options={{
                    locationId: data.location.id
                }}
                showLabels
                locations={data.locations}
                labels={data.labels}
            />
        </section>
    </div>
</main>
