<script lang="ts">
    import { notify } from '$lib/components/notifications/notifications';
    import { Button } from '$lib/components/ui/button';
    import { settingsStore } from '$lib/stores';
    import { api } from '$lib/utils/apiRequest';
    import { getLocation, isNullLocation } from '$lib/utils/geolocation';
    import Plus from 'svelte-material-icons/Plus.svelte';

    import WeatherPartlyCloudy from 'svelte-material-icons/WeatherPartlyCloudy.svelte';

    const confirmMessage =
        'Your current location will be used to provide weather information. Continue?';

    async function enable() {
        if (!confirm(confirmMessage)) return;

        if (!navigator.geolocation) {
            notify.error('Geolocation is not supported by your browser');
            return;
        }

        const location = await getLocation();
        if (isNullLocation(location)) return;
        const [lat, lon] = location;

        await api.put('/settings', {
            key: 'homeLocation',
            value: [lon, lat]
        });
        $settingsStore.homeLocation.value = [lon, lat];

        notify.success('Home Location set, reloading...');

        // TODO better solution than reload the wrong page...
        window.location.reload();
    }
</script>

<Button
    variant="link"
    on:click={enable}
    class="flex-center relative rounded-full p-2 hover:bg-accent"
>
    <WeatherPartlyCloudy size={24} />
    <span class="absolute text-light top-0 left-0" style="transform: translate(26px, 0px)">
        <Plus size={16} />
    </span>
</Button>
