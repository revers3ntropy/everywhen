<script lang="ts">
    import WeatherIcon from '$lib/components/weather/WeatherIcon.svelte';
    import { kelvinToCelsius } from '$lib/components/weather/weatherUtils';
    import type { OpenWeatherMapAPI } from '$lib/controllers/openWeatherMapAPI/openWeatherMapAPI.server';

    export let weather: OpenWeatherMapAPI.WeatherForDay;
</script>

<span class="flex-center gap-1">
    <span class="text-sm">
        {kelvinToCelsius(weather.temperature.afternoon)}°C
    </span>
    <WeatherIcon {weather} />
</span>
