import { apiResponse } from '../../../lib/utils/apiResponse';
import type { RequestHandler } from './$types';

export const GET = (async () => {
    return apiResponse({
        version: __VERSION__,
    });
}) satisfies RequestHandler;