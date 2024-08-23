import { Entry } from '$lib/controllers/entry/entry.server';
import type { SearchResults } from '$lib/controllers/search/search';
import { apiRes404 } from '$lib/utils/apiResponse.server';
import { cachedApiRoute } from '$lib/utils/cache.server';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET = cachedApiRoute(async (auth, { url }) => {
    const queryString = url.searchParams.get('q');
    if (!queryString) return { results: [] };

    const entries = (await Entry.search(auth, queryString)).unwrap(e => error(400, e));

    return {
        results: [...entries.map(e => ({ ...e, type: 'entry' as const }))] satisfies SearchResults
    };
}) satisfies RequestHandler;

export const POST = apiRes404;
export const PUT = apiRes404;
export const DELETE = apiRes404;
