<script lang="ts">
    import CrosshairsGps from 'svelte-material-icons/CrosshairsGps.svelte';
    import PencilOutline from 'svelte-material-icons/PencilOutline.svelte';
    import Plus from 'svelte-material-icons/Plus.svelte';
    import { Button } from '$lib/components/ui/button';
    import { Location } from '$lib/controllers/location/location';

    export let locations: Location[];
    export let createLocation: () => Promise<void>;

    let creatingLocationLoading = false;
</script>

<div class="py-2 max-h-[350px] max-w-[400px] overflow-y-auto">
    <p class="px-2 text-light font-bold">Locations</p>

    {#each locations as location}
        <div class="flex">
            <a class="p-2 hover:bg-lightAccent flex-center rounded-full" href="/map#{location.id}">
                <CrosshairsGps size={20} />
            </a>
            <a
                class="p-2 hover:bg-lightAccent w-full flex items-center justify-between hover:no-underline rounded-xl"
                href="/map/{location.id}"
            >
                <span>
                    {location.name}
                    <span class="text-light">
                        ({Location.degreesToMeters(location.radius).toFixed(1)}m)
                    </span>
                </span>
                <span class="w-[18px]">
                    <PencilOutline size={18} />
                </span>
            </a>
        </div>
    {/each}
    <div class="p-2">
        {#if creatingLocationLoading}
            <Button disabled variant="outline" class="w-full text-left flex items-center gap-2">
                Creating New Location...
            </Button>
        {:else}
            <Button
                variant="outline"
                class="w-full text-left flex items-center gap-2"
                on:click={() => {
                    creatingLocationLoading = true;
                    // never actually finishes as we redirect to the location page
                    createLocation().then(() => (creatingLocationLoading = false));
                }}
            >
                New Location
                <Plus />
            </Button>
        {/if}
    </div>
</div>
