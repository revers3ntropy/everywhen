import { Export } from '$lib/controllers/export/export.server';
import { apiRes404 } from '$lib/utils/apiResponse.server';
import { cachedApiRoute } from '$lib/utils/cache.server';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET = cachedApiRoute(async auth => {
    return {
        html: (await Export.generateHTML(auth)).unwrap(e => error(400, e))
    };
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const POST = apiRes404;
export const PUT = apiRes404;
