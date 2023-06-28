<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications';
    import { tooltip } from '@svelte-plugins/tooltips';
    import { onMount } from 'svelte';
    import MapMarkerOffOutline from 'svelte-material-icons/MapMarkerOffOutline.svelte';
    import MapMarkerOutline from 'svelte-material-icons/MapMarkerOutline.svelte';
    import { enabledLocation } from '$lib/stores';

    export let tooltipPosition = 'bottom' as TooltipPosition;
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
                },
                () => {
                    enabledLocation.set(false);
                    resolve(false);
                    notify.error(
                        'Something went wrong enabling location' +
                            ' - please check your browser settings'
                    );
                }
            );
        });
    }

    function disableLocation() {
        enabledLocation.set(false);
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
        use:tooltip={{
            content:
                'Location will be recorded with entry. ' +
                'Click to turn off location',
            position: tooltipPosition
        }}
        aria-label="Turn off Location"
    >
        <MapMarkerOutline {size} />
    </button>
{:else}
    <button
        on:click={enableLocation}
        use:tooltip={{
            content:
                'Location is disabled. Click to record location with entry',
            position: tooltipPosition
        }}
        aria-label="Turn on Location"
    >
        <MapMarkerOffOutline {size} />
    </button>
{/if}
