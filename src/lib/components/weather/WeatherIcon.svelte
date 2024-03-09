<script lang="ts">
    import type { OpenWeatherMapAPI } from '$lib/controllers/openWeatherMapAPI/openWeatherMapAPI.server';
    import WeatherSunny from 'svelte-material-icons/WeatherSunny.svelte';
    import WeatherCloudy from 'svelte-material-icons/WeatherCloudy.svelte';
    import WeatherRainy from 'svelte-material-icons/WeatherRainy.svelte';
    import WeatherWindy from 'svelte-material-icons/WeatherWindy.svelte';
    import WeatherPouring from 'svelte-material-icons/WeatherPouring.svelte';

    export let weather: OpenWeatherMapAPI.WeatherForDay;
    export let size: number = 24;
</script>

{#if weather.precipitation.total > 10}
    <WeatherPouring {size} />
{:else if weather.wind.max.speed > 10}
    <WeatherWindy {size} />
{:else if weather.precipitation.total > 3}
    <WeatherRainy {size} />
{:else if weather.cloud_cover.afternoon > 50}
    <WeatherCloudy {size} />
{:else}
    <WeatherSunny {size} />
{/if}
