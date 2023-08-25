import { cachedApiRoute } from '$lib/utils/cache.server';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { apiRes404 } from '$lib/utils/apiResponse.server';

export const GET = cachedApiRoute(async (auth, { url }) => {
    let tz = 0;
    if (url.searchParams.has('tz')) {
        try {
            tz = parseInt(url.searchParams.get('tz') || '0');
        } catch (e) {
            throw error(400, 'Invalid timezone offset (tz)');
        }
    }
    if (tz < -24 || tz > 24) throw error(400, 'Invalid timezone offset (tz)');

    const { val: streaks, err } = await Entry.Server.getStreaks(auth, tz);
    if (err) throw error(400, err);
    return streaks;
}) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
export const PUT = apiRes404;
