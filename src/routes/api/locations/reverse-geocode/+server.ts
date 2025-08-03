import { error } from '@sveltejs/kit';
import { api404Handler } from '$lib/utils/apiResponse.server';
import { cachedApiRoute } from '$lib/utils/cache.server';
import type { RequestHandler } from './$types';
import { Location } from '$lib/controllers/location/location.server';

export const GET = cachedApiRoute(async (_auth, { url }) => {
    const lat = parseFloat(url.searchParams.get('lat') || '');
    const lng = parseFloat(url.searchParams.get('lon') || '');
    if (isNaN(lat)) error(400, 'invalid latitude');
    if (isNaN(lng)) error(400, 'invalid longitude');

    return (await Location.addressLookupFromCoords(lat, lng)).unwrap(e => error(500, e));
}) satisfies RequestHandler;

export const POST = api404Handler;
export const DELETE = api404Handler;
export const PUT = api404Handler;
