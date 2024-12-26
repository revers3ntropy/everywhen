import { Export } from '$lib/controllers/export/export.server';
import { api404Handler } from '$lib/utils/apiResponse.server';
import { cachedApiRoute } from '$lib/utils/cache.server';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET = cachedApiRoute(async auth => {
    return {
        html: (await Export.generateHTML(auth)).unwrap(e => error(400, e))
    };
}) satisfies RequestHandler;

export const DELETE = api404Handler;
export const POST = api404Handler;
export const PUT = api404Handler;
