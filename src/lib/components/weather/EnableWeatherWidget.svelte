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
    class="rounded-full block p-2 hover:bg-accent static"
>
    <WeatherPartlyCloudy size={24} />
    <div class="relative text-light top-0 left-0 h-0" style="transform: translate(14px, -13px)">
        <Plus size={16} />
    </div>
</Button>
