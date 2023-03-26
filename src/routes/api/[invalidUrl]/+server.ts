import type { RequestHandler } from '@sveltejs/kit';
import { apiResponse } from '../../../lib/utils/apiResponse';

export const GET = (async ({}) => {
    return apiResponse({ status: 404 });
}) satisfies RequestHandler;