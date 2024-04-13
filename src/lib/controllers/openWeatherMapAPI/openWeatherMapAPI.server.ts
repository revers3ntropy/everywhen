import { OPEN_WEATHER_MAP_API_KEY } from '$env/static/private';
import { Day } from '$lib/utils/day';
import { FileLogger } from '$lib/utils/log.server';
import { Result } from '$lib/utils/result';
import { roundToDecimalPlaces } from '$lib/utils/text';
import { z } from 'zod';
import { OpenWeatherMapAPI as _OpenWeatherMapAPI } from '$lib/controllers/openWeatherMapAPI/openWeatherMapAPI';

const logger = new FileLogger('OpenWeatherMapAPI');

export namespace OpenWeatherMapAPIServer {
    type WeatherForDay = _OpenWeatherMapAPI.WeatherForDay;

    const weatherForDayExpectedSchema = z.object({
        list: z.array(
            z.object({
                dt: z.number(),
                main: z.object({
                    temp: z.number(),
                    feels_like: z.number(),
                    temp_min: z.number(),
                    temp_max: z.number(),
                    pressure: z.number(),
                    humidity: z.number()
                }),
                wind: z
                    .object({
                        speed: z.number(),
                        deg: z.number()
                    })
                    .default({ speed: 0, deg: 0 }),
                clouds: z
                    .object({
                        all: z.number()
                    })
                    .default({ all: 0 }),
                weather: z.array(
                    z.object({
                        id: z.number(),
                        main: z.string(),
                        description: z.string(),
                        icon: z.string()
                    })
                ),
                rain: z
                    .object({
                        '1h': z.number().optional(),
                        '3h': z.number().optional()
                    })
                    .default({ '1h': 0 }),
                snow: z
                    .object({
                        '1h': z.number().optional(),
                        '3h': z.number().optional()
                    })
                    .default({ '1h': 0 })
            })
        )
    });

    const cache = new Map<string, WeatherForDay>();
    const numRequestsPerDay = new Map<string, number>();

    export function decreaseResolutionOfCoordsForWeather(
        lat: number,
        lon: number
    ): [number, number] {
        // makes caching more efficient and doesn't really effect UX,
        // as weather changes only over a larger area
        return [roundToDecimalPlaces(lat, 1), roundToDecimalPlaces(lon, 1)];
    }

    export async function getWeatherForDay(
        day: Day,
        lat: number,
        lon: number
    ): Promise<Result<WeatherForDay>> {
        const cacheKey = `${day.fmtIso()}-${lat}-${lon}`;
        if (cache.has(cacheKey)) {
            return Result.ok(cache.get(cacheKey));
        }
        // rate limit entire application to avoid fees from OpenWeatherMap
        // (£1.2/1000 requests after 1000 requests per day)
        const reqsToday = numRequestsPerDay.get(Day.today(0).fmtIso()) || 0;
        if (reqsToday > 900) {
            return Result.err('Cannot fetch weather data at this time');
        }
        if (!reqsToday || reqsToday < 1) {
            // memory clean up when day changes
            numRequestsPerDay.clear();
            numRequestsPerDay.set(Day.today(0).fmtIso(), 1);
        } else {
            numRequestsPerDay.set(Day.today(0).fmtIso(), reqsToday + 1);
        }

        // will work up to 1.5 years into the future,
        // but should really only be for days in the past as days in the future
        // is prediction but would display like it's a fact
        if (day.plusDays(-1).isInFuture(0)) {
            return Result.err('Cannot get weather for the future');
        }
        if (!OPEN_WEATHER_MAP_API_KEY) {
            return Result.err('Cannot fetch weather data at this time');
        }

        const [lowResLat, lowResLon] = _OpenWeatherMapAPI.decreaseResolutionOfCoordsForWeather(
            lat,
            lon
        );
        // TODO: deal with timezones here
        const apiUrl = `https://history.openweathermap.org/data/2.5/history/city?lat=${lowResLat}&lon=${lowResLon}&start=${day.utcTimestamp(0)}&cnt=24&appid=${OPEN_WEATHER_MAP_API_KEY}`;
        let res;
        try {
            res = await fetch(apiUrl, {
                method: 'GET'
            });
        } catch (error) {
            await logger.warn('getWeatherForDay: Error connecting to OpenWeatherMap', {
                error,
                day,
                lat,
                lon
            });
            return Result.err('Error connecting to OpenWeatherMap');
        }

        let data;
        try {
            data = await res.json();
        } catch (error) {
            let textRes = 'could not parse response';
            try {
                textRes = await res.text();
            } catch (error) {
                // ignore
            }
            await logger.error('getWeatherForDay: Invalid response from OpenWeatherMap', {
                res,
                textRes,
                error
            });
            return Result.err('Invalid response from OpenWeatherMap');
        }

        const parseResult = weatherForDayExpectedSchema.safeParse(data);

        if (!parseResult.success) {
            await logger.error(`getWeatherForDay: Invalid response from OpenWeatherMap`, { data });
            return Result.err('Invalid response from OpenWeatherMap');
        }

        const weather = cleanWeatherData(parseResult.data, lat, lon);
        if (!weather.ok) {
            await logger.error('getWeatherForDay: Invalid weather data', { data });
            return Result.err('Invalid weather data');
        }

        cache.set(cacheKey, weather.val);
        return Result.ok(weather.val);
    }

    function cleanWeatherData(
        data: z.infer<typeof weatherForDayExpectedSchema>,
        lat: number,
        lon: number
    ): Result<WeatherForDay> {
        if (data.list.length < 1) {
            return Result.err('No weather data found');
        }
        let maxTemp = data.list[0].main.temp_max,
            minTemp = data.list[0].main.temp_min,
            windSpeedMax = data.list[0].wind.speed,
            rainTotal = 0,
            snowTotal = 0;
        const cloudCovers: number[] = [],
            pressures: number[] = [],
            humidities: number[] = [];

        const weatherIcons = {} as Record<string, number>;

        for (const part of data.list) {
            // NOTE: It is possible to meet more than one weather condition for a requested location.
            // The first weather condition in API respond is primary.
            // One weather condition gives one icon.
            // take substring to ignore day/night
            const iconCode = part.weather[0].icon.substring(0, 2);
            weatherIcons[iconCode] = (weatherIcons[part.weather[0].icon] || 0) + 1;

            pressures.push(part.main.pressure);
            humidities.push(part.main.humidity);
            cloudCovers.push(part.clouds.all);

            if (part.rain['1h']) {
                rainTotal += part.rain['1h'];
            }
            if (part.snow['1h']) {
                snowTotal += part.snow['1h'];
            }

            // not sure if this is what I should be doing, but probably about right...
            if (part.rain['3h']) {
                rainTotal += part.rain['3h'] / 3;
            }
            if (part.snow['3h']) {
                snowTotal += part.snow['3h'] / 3;
            }

            if (part.main.temp_max > maxTemp) {
                maxTemp = part.main.temp_max;
            }
            if (part.main.temp_min < minTemp) {
                minTemp = part.main.temp_min;
            }
            if (part.wind.speed > windSpeedMax) {
                windSpeedMax = part.wind.speed;
            }
        }

        const iconCode = Object.keys(weatherIcons).reduce((a, b) =>
            weatherIcons[a] > weatherIcons[b] ? a : b
        );

        return Result.ok({
            maxTemp,
            minTemp,
            iconCode,
            windSpeedMax,
            cloudCoverMean: cloudCovers.reduce((a, b) => a + b, 0) / cloudCovers.length,
            rainTotal,
            snowTotal,
            pressureMean: pressures.reduce((a, b) => a + b, 0) / pressures.length,
            humidityMean: humidities.reduce((a, b) => a + b, 0) / humidities.length,
            lat,
            lon
        });
    }
}

export const OpenWeatherMapAPI = {
    ..._OpenWeatherMapAPI,
    ...OpenWeatherMapAPIServer
};

export type WeatherForDay = _OpenWeatherMapAPI.WeatherForDay;
