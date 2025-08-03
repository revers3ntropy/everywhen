import { Location } from '$lib/controllers/location/location';

export namespace OpenWeatherMapAPI {
    export type WeatherForDay = {
        lat: number;
        lon: number;
        maxTemp: number;
        minTemp: number;
        windSpeedMax: number;
        cloudCoverMean: number;
        rainTotal: number;
        snowTotal: number;
        pressureMean: number;
        humidityMean: number;
        // https://openweathermap.org/weather-conditions
        // 01 | 02 | 03 | 04 | 09 | 10 | 11 | 13 | 50
        // ignore day/night
        iconCode: string;
    };

    export function decreaseResolutionOfCoordsForWeather(
        lat: number,
        lon: number
    ): [number, number] {
        // makes caching more efficient and doesn't really effect UX,
        // as weather changes only over a larger area
        return Location.decreaseResolutionOfCoords(lat, lon, 1);
    }
}
