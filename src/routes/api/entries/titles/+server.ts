import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { apiRes404 } from '$lib/utils/apiResponse.server';
import { cachedApiRoute } from '$lib/utils/cache.server';

export const GET = cachedApiRoute(async (auth, { url }) => {
    const count = parseInt(url.searchParams.get('count') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    return (await Entry.Server.getPageOfSummaries(auth, count, offset)).unwrap(err =>
        error(400, err)
    );
}) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
export const PUT = apiRes404;
