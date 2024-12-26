import { Entry } from '$lib/controllers/entry/entry.server';
import { api404Handler } from '$lib/utils/apiResponse.server';
import { cachedApiRoute } from '$lib/utils/cache.server';
import { error, type RequestHandler } from '@sveltejs/kit';

export const GET = cachedApiRoute(async (auth, { url }) => {
    const tz = parseInt(url.searchParams.get('tz') || '0');
    if (tz < -24 || tz > 24 || isNaN(tz)) error(400, 'Invalid timezone offset (tz)');

    return (await Entry.getSummariesNYearsAgo(auth, tz)).unwrap(e => error(400, e));
}) satisfies RequestHandler;

export const POST = api404Handler;
export const DELETE = api404Handler;
export const PUT = api404Handler;
