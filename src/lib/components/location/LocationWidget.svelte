<script lang="ts">
    import { tooltip } from '@svelte-plugins/tooltips';
    import MapMarker from 'svelte-material-icons/MapMarkerOutline.svelte';
    import { Location } from '$lib/controllers/location';
    import type { Auth } from '$lib/controllers/user';
    import { obfuscate } from '$lib/utils/text';
    import Dot from '../Dot.svelte';

    const MAX_LOCATIONS_SHOWN = 2;

    export let auth: Auth;
    export let obfuscated = false;
    export let locations: Location[] | null;
    export let entryId: string | null = null;
    export let latitude: number;
    export let longitude: number;

    let nearby = [] as Location[];
    let touching = [] as Location[];

    $: if (locations) {
        let res = Location.filterLocationsByPoint(locations, {
            latitude,
            longitude
        });
        nearby = res.near;
        touching = res.touching;
    }

    $: coordsTooltip = {
        content: `Created at ${latitude}, ${longitude} (lat, lng)`,
        position: 'right' as TooltipPosition
    };
</script>

<span class="outer">
    {#if entryId}
        <span use:tooltip={coordsTooltip} class="flex-center">
            <MapMarker size="20" />
        </span>
    {:else}
        <span use:tooltip={coordsTooltip} class="flex-center">
            <MapMarker size="20" />
        </span>
    {/if}
    {#if touching.length}
        <span class="multi-locations-container">
            {#each touching as location, i}
                {#if i < MAX_LOCATIONS_SHOWN}
                    {#if obfuscated}
                        <span class="text-light ellipsis obfuscated">
                            {obfuscate(location.name)}
                        </span>
                    {:else}
                        <a href="/map/{location.id}" class="ellipsis">
                            {location.name}
                        </a>
                    {/if}
                    {#if i < touching.length - 1}
                        <Dot />
                    {/if}
                {:else if i === MAX_LOCATIONS_SHOWN}
                    <span
                        use:tooltip={{
                            content: touching
                                .slice(MAX_LOCATIONS_SHOWN)
                                .map(l => l.name)
                                .join(', ')
                        }}
                        class="flex-center"
                        style="width: 10px"
                    >
                        <span> ... </span>
                    </span>
                {/if}
            {/each}
        </span>
    {:else if nearby && nearby?.length}
        <span class="flex-center ellipsis" style="gap: 0.2rem">
            <span class="text-light">near</span>
            {#if obfuscated}
                <span class="text-light ellipsis obfuscated">
                    {obfuscate(nearby[0].name)}
                </span>
            {:else}
                <a href="/map/{nearby[0].id}" class="ellipsis">
                    {nearby[0].name}
                </a>
            {/if}
        </span>
    {/if}
</span>

<style lang="less">
    @import '../../../styles/variables';

    .outer {
        display: flex;
        align-items: center;

        font-size: 0.9rem;
        color: var(--text-color-light);
        max-width: 100%;

        .multi-locations-container {
            max-width: 100%;
            display: flex;
            align-items: center;
        }
    }
</style>
