<script lang="ts">
    import CrosshairsGps from 'svelte-material-icons/CrosshairsGps.svelte';
    import { Location } from '$lib/controllers/location/location';

    export let locations: Location[];
</script>

<div class="py-2">
    <p class="px-2 text-light font-bold">Locations</p>

    {#each locations as location}
        <div class="flex">
            <a class="p-2 hover:bg-lightAccent" href="/map#{location.id}">
                <CrosshairsGps size={20} />
            </a>
            <a
                class="p-2 hover:bg-lightAccent w-full text-left block hover:no-underline"
                href="/map/{location.id}"
            >
                {location.name} ({Location.degreesToMeters(location.radius)}m)
            </a>
        </div>
    {/each}
</div>
