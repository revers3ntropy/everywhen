import { api404Handler } from '$lib/utils/apiResponse.server';
import { cachedApiRoute } from '$lib/utils/cache.server';
import { Day } from '$lib/utils/day';
import type { RequestHandler } from './$types';
import { error } from '@sveltejs/kit';
import { Feed } from '$lib/controllers/feed/feed.server';

export const GET = cachedApiRoute(async (auth, { params }) => {
    return (
        await Feed.getDay(
            auth,
            Day.fromString(params.day).unwrap(e => error(400, e))
        )
    ).unwrap(e => error(500, e));
}) satisfies RequestHandler;

export const POST = api404Handler;
export const DELETE = api404Handler;
export const PUT = api404Handler;
