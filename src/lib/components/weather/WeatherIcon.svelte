<script lang="ts">
    import type { OpenWeatherMapAPI } from '$lib/controllers/openWeatherMapAPI/openWeatherMapAPI.server';
    import WeatherSunny from 'svelte-material-icons/WeatherSunny.svelte';
    import WeatherCloudy from 'svelte-material-icons/WeatherCloudy.svelte';
    import WeatherRainy from 'svelte-material-icons/WeatherRainy.svelte';
    import WeatherLightningRainy from 'svelte-material-icons/WeatherLightningRainy.svelte';
    import WeatherSnowy from 'svelte-material-icons/WeatherSnowy.svelte';
    import WeatherFog from 'svelte-material-icons/WeatherFog.svelte';
    import WeatherPartlyCloudy from 'svelte-material-icons/WeatherPartlyCloudy.svelte';

    export let weather: OpenWeatherMapAPI.WeatherForDay;
    export let size: number = 24;
</script>

{#if weather.iconCode === '01'}
    <WeatherSunny {size} />
{:else if weather.iconCode === '02'}
    <WeatherPartlyCloudy {size} />
{:else if weather.iconCode === '03'}
    <WeatherCloudy {size} />
{:else if weather.iconCode === '04'}
    <WeatherCloudy {size} />
{:else if weather.iconCode === '09'}
    <WeatherRainy {size} />
{:else if weather.iconCode === '10'}
    <WeatherRainy {size} />
{:else if weather.iconCode === '11'}
    <WeatherLightningRainy {size} />
{:else if weather.iconCode === '13'}
    <WeatherSnowy {size} />
{:else if weather.iconCode === '50'}
    <WeatherFog {size} />
{:else}
    ?
{/if}
