<script lang="ts">
    // @ts-ignore
    import { tooltip } from '@svelte-plugins/tooltips';
    import { onMount } from 'svelte';
    import MapMarkerOffOutline from 'svelte-material-icons/MapMarkerOffOutline.svelte';
    import MapMarkerOutline from 'svelte-material-icons/MapMarkerOutline.svelte';
    import { getNotificationsContext } from 'svelte-notifications';
    import { enabledLocation } from '../../lib/constants';

    const { addNotification } = getNotificationsContext();

    async function watchLocationPermissions () {
        const permissionStatus = await navigator
            .permissions
            .query({ name: 'geolocation' });

        function checkPermission () {
            if (permissionStatus.state !== 'granted') {
                enabledLocation.set(false);
            } else {
                // show location button in chrome menu
                navigator.geolocation.getCurrentPosition(() => 0);
            }
        }

        permissionStatus.onchange = checkPermission;
        checkPermission();
    }

    async function enableLocation () {
        // trigger the permission request
        navigator.geolocation.getCurrentPosition(() => {
            enabledLocation.set(true);
        }, () => {
            enabledLocation.set(false);
            addNotification({
                text: 'Something went wrong enabling location'
                    + ' - please check your browser settings',
                removeAfter: 8000,
                type: 'error',
                position: 'top-center',
            });
        });
    }

    function disableLocation () {
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
            content: 'Location will be recorded, click to turn off location'
        }}
        aria-label="Turn off Location"
    >
        <MapMarkerOutline size="25" />
    </button>
{:else}
    <button
        on:click={enableLocation}
        use:tooltip={{
            content: 'Location is disabled, click to record location with entry'
        }}
        aria-label="Turn on Location"
    >
        <MapMarkerOffOutline size="25" />
    </button>
{/if}