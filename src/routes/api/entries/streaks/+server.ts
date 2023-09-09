import { Entry } from '$lib/controllers/entry/entry.server';
import { apiRes404 } from '$lib/utils/apiResponse.server';
import { cachedApiRoute } from '$lib/utils/cache.server';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

export const GET = cachedApiRoute(async (auth, { url }) => {
    const tz = parseInt(url.searchParams.get('tz') || '0');
    if (tz < -24 || tz > 24 || isNaN(tz)) throw error(400, 'Invalid timezone offset (tz)');

    return (await Entry.getStreaks(auth, tz)).unwrap(e => error(400, e));
}) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
export const PUT = apiRes404;
