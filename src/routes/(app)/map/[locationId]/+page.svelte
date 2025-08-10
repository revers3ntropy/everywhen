<script lang="ts">
    import Info from 'svelte-material-icons/InformationOutline.svelte';
    import { goto } from '$app/navigation';
    import EditLocation from '$lib/components/location/EditLocation.svelte';
    import Entries from '$lib/components/entry/Entries.svelte';
    import { listen } from '$lib/dataChangeEvents';
    import type { PageData } from './$types';
    import Mapbox from '$lib/components/map/Mapbox.svelte';
    import { Button } from '$lib/components/ui/button';
    import ChevronLeft from 'svelte-material-icons/ChevronLeft.svelte';
    import { tryDecryptText } from '$lib/utils/encryption.client.js';

    export let data: PageData;

    listen.location.onDelete(async id => {
        if (location.id === id) {
            await goto('/map');
        }
    });
    listen.location.onUpdate(l => {
        if (l.id !== location.id) return;
        location = l;
    });

    let location = data.location;
</script>

<svelte:head>
    <title>{tryDecryptText(location.name)} | Location</title>
</svelte:head>
<main class="md:p-4 md:pl-4 flex-center">
    <div class="w-full md:max-w-5xl">
        <div class="pb-4">
            <a href="/map#{location.id}">
                <Button variant="outline" class="border-border border-2 text-textColor pl-2">
                    <ChevronLeft size={20} /> Back to Map
                </Button>
            </a>
        </div>

        <section class="md:rounded-lg md:bg-vLightAccent px-2">
            <EditLocation {...location} />
        </section>

        <section class="h-[50vh] md:rounded-lg py-4">
            <p class="text-sm text-light pt-4 pb-2 flex items-center gap-2">
                <Info size={20} />
                Drag the handles to change the size and placement of the Location
            </p>
            {#key location}
                <Mapbox
                    locations={[location]}
                    bounds={[
                        {
                            lat: location.latitude + location.radius * 1.2,
                            lng: location.longitude - location.radius * 1.2
                        },
                        {
                            lat: location.latitude - location.radius * 1.2,
                            lng: location.longitude + location.radius * 1.2
                        }
                    ]}
                    locationsAreEditable
                    class="rounded-lg"
                />
            {/key}
        </section>

        <section class="mt-16 block">
            <p class="text-sm text-light pb-2 flex items-center gap-2">
                <Info size={20} />
                Entries will only appear here if you had location enabled when you submitted it
            </p>
            {#key location}
                <Entries
                    options={{
                        locationId: location.id
                    }}
                    showLabels
                    locations={data.locations}
                    labels={data.labels}
                />
            {/key}
        </section>
    </div>
</main>
