<script lang="ts">
    import WeatherIcon from '$lib/components/weather/WeatherIcon.svelte';
    import { kelvinToCelsius } from '$lib/components/weather/weatherUtils';
    import { OpenWeatherMapAPI } from '$lib/controllers/openWeatherMapAPI/openWeatherMapAPI';
    import type { Day } from '$lib/utils/day';

    export let day: Day;
    export let weather: OpenWeatherMapAPI.WeatherForDay;

    let lat: number, lon: number;
    $: [lat, lon] = OpenWeatherMapAPI.decreaseResolutionOfCoordsForWeather(
        weather.lat,
        weather.lon
    );
</script>

<div>
    <div class="flex justify-between pb-2">
        <div class="flex-center gap-2">
            <WeatherIcon {weather} size={30} />
            <h3>{day.dateObj().toDateString()}</h3>
        </div>
        <span class="text-textColorLight text-sm hide-mobile">
            (at lat {lat}, lon {lon})
        </span>
    </div>
    <p>
        <span class="text-textColorLight">Maximum Temperature:</span>
        {kelvinToCelsius(weather.maxTemp).toPrecision(2)}°C
    </p>
    <p> <span class="text-textColorLight">Rain:</span> {weather.rainTotal.toFixed(1)}mm </p>
    <p> <span class="text-textColorLight">Snow:</span> {weather.snowTotal.toFixed(1)}mm </p>
    <p>
        <span class="text-textColorLight">Humidity:</span>
        {weather.humidityMean.toPrecision(3)}%
    </p>
    <p>
        <span class="text-textColorLight">Cloud cover:</span>
        {weather.cloudCoverMean.toPrecision(2)}%
    </p>
    <p>
        <span class="text-textColorLight">Max wind speed:</span>
        {weather.windSpeedMax.toPrecision(3)} m/s
    </p>
    <p>
        <span class="text-textColorLight">Pressure:</span>
        {weather.pressureMean.toPrecision(4)} mb
    </p>
</div>
