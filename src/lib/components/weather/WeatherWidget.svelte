<script lang="ts">
    import WeatherIcon from '$lib/components/weather/WeatherIcon.svelte';
    import { kelvinToCelsius } from '$lib/components/weather/weatherUtils';
    import type { OpenWeatherMapAPI } from '$lib/controllers/openWeatherMapAPI/openWeatherMapAPI';

    export let weather: OpenWeatherMapAPI.WeatherForDay;
    export let iconSize = 20;
</script>

<span class="flex-center gap-1">
    <span class="text-sm">
        {kelvinToCelsius(weather.maxTemp)}°C
    </span>
    <WeatherIcon {weather} size={iconSize} />
</span>
