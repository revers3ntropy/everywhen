<script lang="ts">
    import { goto } from '$app/navigation';
    import EditLocation from '$lib/components/location/EditLocation.svelte';
    import Entries from '$lib/components/entry/Entries.svelte';
    import { listen } from '$lib/dataChangeEvents';
    import type { PageData } from './$types';
    import Mapbox from '$lib/components/map/Mapbox.svelte';
    import { Button } from '$lib/components/ui/button';
    import ChevronLeft from 'svelte-material-icons/ChevronLeft.svelte';

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
        <div class="pb-4">
            <a href="/map#{data.location.id}">
                <Button variant="outline" class="border-border border-2 text-textColor pl-2">
                    <ChevronLeft size={20} /> Back to Map
                </Button>
            </a>
        </div>

        <section class="md:rounded-lg md:bg-vLightAccent px-2">
            <EditLocation {...data.location} />
        </section>

        <div class="h-[50vh] md:rounded-lg py-4">
            <p class="italic text-light"
                >Drag the handles to change the size and placement of the Location</p
            >
            <Mapbox
                locations={[data.location]}
                bounds={[
                    {
                        lat: data.location.latitude + data.location.radius * 1.2,
                        lng: data.location.longitude - data.location.radius * 1.2
                    },
                    {
                        lat: data.location.latitude - data.location.radius * 1.2,
                        lng: data.location.longitude + data.location.radius * 1.2
                    }
                ]}
                locationsAreEditable
                class="rounded-lg"
            />
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
