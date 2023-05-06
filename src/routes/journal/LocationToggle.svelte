<script lang="ts">
    import { notify } from '$lib/notifications/notifications';
    import { tooltip } from '@svelte-plugins/tooltips';
    import { onMount } from 'svelte';
    import MapMarkerOffOutline from 'svelte-material-icons/MapMarkerOffOutline.svelte';
    import MapMarkerOutline from 'svelte-material-icons/MapMarkerOutline.svelte';
    import { enabledLocation } from '$lib/stores';
    import type { TooltipPosition } from '../../app';

    export let tooltipPosition: TooltipPosition = 'bottom';

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

{#if $enabledLocation}
    <button
        on:click={disableLocation}
        use:tooltip={{
            content: 'Location will be recorded, click to turn off location',
            position: tooltipPosition
        }}
        aria-label="Turn off Location"
    >
        <MapMarkerOutline size="25" />
    </button>
{:else}
    <button
        on:click={enableLocation}
        use:tooltip={{
            content:
                'Location is disabled, click to record location with entry',
            position: tooltipPosition
        }}
        aria-label="Turn on Location"
    >
        <MapMarkerOffOutline size="25" />
    </button>
{/if}
