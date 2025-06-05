import { Stats } from '$lib/controllers/stats/stats.server';
import { api404Handler } from '$lib/utils/apiResponse.server';
import { cachedApiRoute } from '$lib/utils/cache.server';
import { error, type RequestHandler } from '@sveltejs/kit';

export const GET = cachedApiRoute(async (auth, { params }) => {
    if (!params['word']) error(400, 'Word is required');

    return {
        chartData: await Stats.chartDataForWord(auth, params['word'])
    };
}) satisfies RequestHandler;

export const POST = api404Handler;
export const DELETE = api404Handler;
export const PUT = api404Handler;
