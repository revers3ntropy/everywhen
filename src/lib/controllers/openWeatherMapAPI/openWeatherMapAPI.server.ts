import { OPEN_WEATHER_MAP_API_KEY } from '$env/static/private';
import { Day } from '$lib/utils/day';
import { FileLogger } from '$lib/utils/log.server';
import { Result } from '$lib/utils/result';
import { z } from 'zod';

const logger = new FileLogger('OpenWeatherMapAPI');

const weatherForDayExpectedSchema = z.object({
    lat: z.number(),
    lon: z.number(),
    tz: z.string(),
    date: z.string(),
    units: z.string(),
    cloud_cover: z.object({
        afternoon: z.number()
    }),
    humidity: z.object({
        afternoon: z.number()
    }),
    precipitation: z.object({
        total: z.number()
    }),
    temperature: z.object({
        min: z.number(),
        max: z.number(),
        afternoon: z.number(),
        night: z.number(),
        evening: z.number(),
        morning: z.number()
    }),
    pressure: z.object({
        afternoon: z.number()
    }),
    wind: z.object({
        max: z.object({
            speed: z.number(),
            direction: z.number()
        })
    })
});

export namespace OpenWeatherMapAPI {
    export type WeatherForDay = z.infer<typeof weatherForDayExpectedSchema>;

    const cache = new Map<string, WeatherForDay>();
    const numRequestsPerDay = new Map<string, number>();

    export async function getWeatherForDay(
        day: Day,
        lat: number,
        long: number
    ): Promise<Result<WeatherForDay>> {
        const cacheKey = `${day.fmtIso()}-${lat}-${long}`;
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
        const apiUrl = `https://api.openweathermap.org/data/3.0/onecall/day_summary?lat=${lat}&lon=${long}&date=${day.fmtIso()}&appid=${OPEN_WEATHER_MAP_API_KEY}`;
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
                long
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

        cache.set(cacheKey, parseResult.data);
        return Result.ok(parseResult.data);
    }
}
