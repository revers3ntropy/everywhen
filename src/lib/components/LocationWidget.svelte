<script lang="ts">
    // @ts-ignore
    import { tooltip } from '@svelte-plugins/tooltips';
    import { onMount } from 'svelte';
    import MapMarker from 'svelte-material-icons/MapMarkerOutline.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import type { Location } from '../controllers/location';
    import type { Auth } from '../controllers/user';
    import { api } from '../utils/apiRequest';
    import { displayNotifOnErr } from '../utils/notifications';
    import Dot from './Dot.svelte';

    const MAX_LOCATIONS_SHOWN = 2;

    export const { addNotification } = getNotificationsContext();

    export let auth: Auth;
    export let entryId: string | null = null;
    export let latitude: number;
    export let longitude: number;

    let locations: Location[];
    let nearby = null as Location[] | null;
    let loaded = false;

    async function load () {
        const res = displayNotifOnErr(
            addNotification,
            await api.get(auth, '/locations', { lat: latitude, lon: longitude }),
        );
        locations = res.locations;
        nearby = ('nearby' in res && res.nearby) ? res.nearby : null;
        loaded = true;
    }

    onMount(load);

    $: coordsTooltip = { content: `Created at ${latitude}, ${longitude} (lat, lng)` };
</script>

<span class="outer">
    {#if entryId}
        <a
            use:tooltip={coordsTooltip}
            href="/journal/{entryId}"
        >
            <MapMarker size="20" />
        </a>
    {:else}
        <span use:tooltip={coordsTooltip}>
            <MapMarker size="20" />
        </span>
    {/if}
    {#if loaded}
        {#if locations.length}
            <span class="multi-locations-container">
                {#each locations as location, i}
                    {#if i < MAX_LOCATIONS_SHOWN}
                        <a href="/location/{location.id}">
                            {location.name}
                            {#if i < locations.length - 1}
                                <Dot />
                            {/if}
                        </a>
                    {:else if i === MAX_LOCATIONS_SHOWN}
                        <span
                            use:tooltip={{
                                content: locations.slice(MAX_LOCATIONS_SHOWN)
                                              .map(l => l.name)
                                              .join(', '),
                            }}
                        >
                            ...
                        </span>
                    {/if}
                {/each}
            </span>
        {:else if nearby && nearby?.length}
            <span class="flex-center" style="gap: 0.2rem">
                <span class="text-light">near</span>
                <a href="/location/{nearby[0].id}">
                    {nearby[0].name}
                </a>
            </span>
        {/if}
    {:else}
        ...
    {/if}
</span>

<style lang="less">
    @import '../../styles/variables';

    .outer {
        display: flex;
        justify-content: center;
        align-items: center;

        font-size: 0.9rem;
        color: @text-color-light;

        .multi-locations-container {
            display: flex;
            justify-content: center;
            align-items: center;
        }
    }
</style>