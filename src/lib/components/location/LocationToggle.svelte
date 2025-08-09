<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications';
    import { onMount } from 'svelte';
    import MapMarkerOffOutline from 'svelte-material-icons/MapMarkerOffOutline.svelte';
    import MapMarkerOutline from 'svelte-material-icons/MapMarkerOutline.svelte';
    import { enabledLocation, settingsStore } from '$lib/stores';
    import type { Pixels } from '../../../types';

    export let size = 25 as Pixels;

    async function watchLocationPermissions() {
        const permissionStatus = await navigator.permissions.query({
            name: 'geolocation'
        });

        function checkPermission() {
            // enable location if we don't have a preference set locally but we
            // do prefer location on or the local preference is enabled,
            // and location permission is granted by browser
            $enabledLocation =
                permissionStatus.state === 'granted' &&
                (($enabledLocation === null && $settingsStore.preferLocationOn.value) ||
                    !!$enabledLocation);
        }

        permissionStatus.onchange = checkPermission;
        checkPermission();
    }

    function enableLocation(): Promise<boolean> {
        return new Promise(resolve => {
            // trigger the permission request
            navigator.geolocation.getCurrentPosition(
                () => {
                    $enabledLocation = true;
                    resolve(true);
                    notify.success('Location enabled and will be recorded with each entry');
                },
                () => {
                    $enabledLocation = false;
                    resolve(false);
                    notify.error('Failed to get location. Please check your browser settings.');
                }
            );
        });
    }

    function disableLocation() {
        $enabledLocation = false;
        if ($settingsStore.preferLocationOn.value) {
            notify.success('Location disabled temporarily');
        } else {
            notify.error('Location disabled');
        }
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
        class="hover:bg-vLightAccent rounded-full p-1.5 flex-center border-solid border border-transparent"
    >
        <MapMarkerOutline {size} />
    </button>
{:else}
    <button
        on:click={enableLocation}
        aria-label="Turn on Location"
        class="hover:bg-vLightAccent rounded-full p-1.5 flex-center border-accentDanger border border-solid"
    >
        <MapMarkerOffOutline {size} />
    </button>
{/if}
