import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { api404Handler } from '$lib/utils/apiResponse.server';
import { cachedApiRoute } from '$lib/utils/cache.server';

export const GET = cachedApiRoute(async (auth, { url }) => {
    const count = parseInt(url.searchParams.get('count') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    return (await Entry.getPageOfSummaries(auth, count, offset)).unwrap(err => error(400, err));
}) satisfies RequestHandler;

export const POST = api404Handler;
export const DELETE = api404Handler;
export const PUT = api404Handler;
