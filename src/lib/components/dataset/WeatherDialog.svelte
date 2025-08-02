<script lang="ts">
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
    <div class="pb-2">
        <p>Weather on {day.fmt('ddd Do MMM, YYYY')}</p>
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
        {weather.humidityMean.toFixed(0)}%
    </p>
    <p>
        <span class="text-textColorLight">Cloud cover:</span>
        {weather.cloudCoverMean.toFixed(0)}%
    </p>
    <p>
        <span class="text-textColorLight">Max wind speed:</span>
        {weather.windSpeedMax.toPrecision(3)} m/s
    </p>
    <p>
        <span class="text-textColorLight">Pressure:</span>
        {weather.pressureMean.toPrecision(4)} mb
    </p>
    <p class="pt-4 text-sm">
        Source: <a href="https://openweathermap.org/" target="_blank">openweathermap.org</a>
    </p>
</div>
