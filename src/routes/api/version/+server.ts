import { apiRes404, apiResponse } from '../../../lib/utils/apiResponse';
import type { RequestHandler } from './$types';

export const GET = (async () => {
    return apiResponse({
        version: __VERSION__,
    });
}) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
export const PUT = apiRes404;