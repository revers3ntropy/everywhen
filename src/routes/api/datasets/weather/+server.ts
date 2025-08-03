import { api404Handler } from '$lib/utils/apiResponse.server';
import { cachedApiRoute } from '$lib/utils/cache.server';
import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { OpenWeatherMapAPI } from '$lib/controllers/openWeatherMapAPI/openWeatherMapAPI.server';
import { Day } from '$lib/utils/day';

export const GET = cachedApiRoute(async (_auth, { url }) => {
    const day = Day.fromString(url.searchParams.get('day') ?? '');
    if (!day.ok) error(400, 'invalid day');
    const lat = parseFloat(url.searchParams.get('latitude') ?? '');
    if (isNaN(lat)) error(400, 'invalid latitude');
    const lon = parseFloat(url.searchParams.get('longitude') ?? '');
    if (isNaN(lon)) error(400, 'invalid longitude');

    return (await OpenWeatherMapAPI.getWeatherForDay(day.val, lat, lon)).unwrap(e => error(400, e));
}) satisfies RequestHandler;

export const POST = api404Handler;
export const DELETE = api404Handler;
export const PUT = api404Handler;
