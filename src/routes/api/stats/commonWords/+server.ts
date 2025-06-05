import { Stats } from '$lib/controllers/stats/stats.server';
import { api404Handler } from '$lib/utils/apiResponse.server';
import { cachedApiRoute } from '$lib/utils/cache.server';
import type { RequestHandler } from './$types';

export const GET = cachedApiRoute(async (auth, { url }) => {
    const count = parseInt(url.searchParams.get('count') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    return { words: await Stats.wordCounts(auth, offset, count), offset, count };
}) satisfies RequestHandler;

export const POST = api404Handler;
export const DELETE = api404Handler;
export const PUT = api404Handler;
