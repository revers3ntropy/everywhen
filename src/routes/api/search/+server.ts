import { Search } from '$lib/controllers/search/search.server';
import { api404Handler } from '$lib/utils/apiResponse.server';
import { cachedApiRoute } from '$lib/utils/cache.server';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET = cachedApiRoute(async (auth, { url }) => {
    const queryString = url.searchParams.get('q');
    if (!queryString) return { results: [] };
    return {
        results: (await Search.search(auth, queryString)).unwrap(e => error(400, e))
    };
}) satisfies RequestHandler;

export const POST = api404Handler;
export const PUT = api404Handler;
export const DELETE = api404Handler;
