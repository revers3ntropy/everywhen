import { apiRes404, apiResponse } from '../../../lib/utils/apiResponse';
import type { RequestHandler } from './$types';

const GET_RES = {
    version: __VERSION__
};

export const GET = (() => apiResponse(GET_RES)) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
export const PUT = apiRes404;
