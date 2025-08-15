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

    const buttonClass =
        'hover:bg-lightAccent rounded-full p-1.5 pr-3 flex-center gap-1 border-border border border-solid text-sm text-light';
</script>

{#if $enabledLocation === null}
    ...
{:else if $enabledLocation === true}
    <button on:click={disableLocation} aria-label="Turn off Location" class={buttonClass}>
        <MapMarkerOutline {size} />
        Location enabled
    </button>
{:else}
    <button on:click={enableLocation} aria-label="Turn on Location" class={buttonClass}>
        <MapMarkerOffOutline {size} />
        Location disabled
    </button>
{/if}
