import { cachedApiRoute } from '$lib/utils/cache';
import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry';
import { query } from '$lib/db/mysql';
import { apiRes404 } from '$lib/utils/apiResponse';

export const GET = cachedApiRoute(async auth => {
    const { val: streaks, err } = await Entry.getStreaks(query, auth);
    if (err) throw error(400, err);
    return streaks;
}) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
export const PUT = apiRes404;
