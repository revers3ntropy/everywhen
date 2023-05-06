<script lang="ts">
    import { limitStrLen } from '$lib/utils/text.js';
    import { tooltip } from '@svelte-plugins/tooltips';
    import MapMarker from 'svelte-material-icons/MapMarkerOutline.svelte';
    import type { Location } from '../controllers/location';
    import type { Auth } from '../controllers/user';
    import { api } from '../utils/apiRequest';
    import { displayNotifOnErr } from '../notifications/notifications';
    import { obfuscate } from '../utils/text';
    import Dot from './Dot.svelte';
    import { inview } from 'svelte-inview';

    const MAX_LOCATIONS_SHOWN = 2;

    export let auth: Auth;
    export let obfuscated = false;
    export let entryId: string | null = null;
    export let latitude: number;
    export let longitude: number;

    let locations: Location[];
    let nearby = null as Location[] | null;
    let loaded = false;

    async function load() {
        const res = displayNotifOnErr(
            await api.get(auth, '/locations', { lat: latitude, lon: longitude })
        );
        locations = res.locations;
        nearby = 'nearby' in res && res.nearby ? res.nearby : null;
        loaded = true;
    }

    $: coordsTooltip = {
        content: `Created at ${latitude}, ${longitude} (lat, lng)`,
        position: 'right'
    };
</script>

<span
    class="outer"
    use:inview={{ rootMargin: '50px', unobserveOnEnter: true }}
    on:inview_enter={() => {
        if (!loaded) {
            void load();
        }
    }}
>
    {#if entryId}
        <a use:tooltip={coordsTooltip} href="/journal/{entryId}">
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
                        {#if obfuscated}
                            <span class="text-light ellipsis obfuscated">
                                {obfuscate(limitStrLen(location.name, 20))}
                            </span>
                        {:else}
                            <a href="/map/{location.id}" class="ellipsis">
                                {limitStrLen(location.name, 20)}
                            </a>
                        {/if}
                        {#if i < locations.length - 1}
                            <Dot />
                        {/if}
                    {:else if i === MAX_LOCATIONS_SHOWN}
                        <span
                            use:tooltip={{
                                content: locations
                                    .slice(MAX_LOCATIONS_SHOWN)
                                    .map(l => l.name)
                                    .join(', ')
                            }}
                        >
                            ...
                        </span>
                    {/if}
                {/each}
            </span>
        {:else if nearby && nearby?.length}
            <span class="flex-center ellipsis" style="gap: 0.2rem">
                <span class="text-light">near</span>
                {#if obfuscated}
                    <span class="text-light ellipsis obfuscated">
                        {obfuscate(limitStrLen(nearby[0].name, 20))}
                    </span>
                {:else}
                    <a href="/map/{nearby[0].id}" class="ellipsis">
                        {limitStrLen(nearby[0].name, 20)}
                    </a>
                {/if}
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
