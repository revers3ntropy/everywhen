<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications';
    import { onMount } from 'svelte';
    import MapMarkerOffOutline from 'svelte-material-icons/MapMarkerOffOutline.svelte';
    import MapMarkerOutline from 'svelte-material-icons/MapMarkerOutline.svelte';
    import { enabledLocation } from '$lib/stores';
    import type { Pixels } from '../../../types';

    export let size = 25 as Pixels;

    async function watchLocationPermissions() {
        const permissionStatus = await navigator.permissions.query({
            name: 'geolocation'
        });

        function checkPermission() {
            if (permissionStatus.state !== 'granted') {
                enabledLocation.set(false);
            }
        }

        permissionStatus.onchange = checkPermission;
        checkPermission();
    }

    function enableLocation(): Promise<boolean> {
        return new Promise(resolve => {
            // trigger the permission request
            navigator.geolocation.getCurrentPosition(
                () => {
                    enabledLocation.set(true);
                    resolve(true);
                    notify.success('Location enabled and will be recorded with each entry');
                },
                () => {
                    enabledLocation.set(false);
                    resolve(false);
                    notify.error('Failed to get location. Please check your browser settings.');
                }
            );
        });
    }

    function disableLocation() {
        enabledLocation.set(false);
        notify.success('Location disabled');
    }

    onMount(async () => {
        await watchLocationPermissions();
    });
</script>

{#if $enabledLocation === null}
    ...
{:else if $enabledLocation === true}
    <button
        on:click={disableLocation}
        aria-label="Turn off Location"
        class="hover:bg-vLightAccent rounded-full p-1.5 flex-center"
    >
        <MapMarkerOutline {size} />
    </button>
{:else}
    <button
        on:click={enableLocation}
        aria-label="Turn on Location"
        class="hover:bg-vLightAccent rounded-full p-1.5 flex-center"
    >
        <MapMarkerOffOutline {size} />
    </button>
{/if}
