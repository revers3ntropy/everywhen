<script lang="ts">
    import WeatherIcon from '$lib/components/weather/WeatherIcon.svelte';
    import { kelvinToCelsius } from '$lib/components/weather/weatherUtils.js';
    import type { OpenWeatherMapAPI } from '$lib/controllers/openWeatherMapAPI/openWeatherMapAPI.server';
    import type { Day } from '$lib/utils/day';

    export let day: Day;
    export let weather: OpenWeatherMapAPI.WeatherForDay;
</script>

<div>
    <div class="flex justify-between pb-2">
        <div class="flex-center gap-2">
            <WeatherIcon {weather} size={30} />
            <h3>{day.dateObj().toDateString()}</h3>
        </div>
        <span class="text-textColorLight text-sm">
            (at lat {weather.lat}, lon {weather.lon})
        </span>
    </div>
    <p>
        <span class="text-textColorLight">Temperature (at 12pm):</span>
        {kelvinToCelsius(weather.temperature.afternoon)}°C
    </p>
    <p> <span class="text-textColorLight">Precipitation:</span> {weather.precipitation.total} </p>
    <p>
        <span class="text-textColorLight">Humidity (at 12pm):</span>
        {weather.humidity.afternoon}mm
    </p>
    <p>
        <span class="text-textColorLight">Cloud cover (at 12pm):</span>
        {weather.cloud_cover.afternoon}%
    </p>
    <p> <span class="text-textColorLight">Max wind speed:</span> {weather.wind.max.speed} m/s </p>
    <p> <span class="text-textColorLight">Pressure:</span> {weather.pressure.afternoon} mb </p>
</div>
