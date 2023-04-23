import {
    apiRes404,
    apiResponse,
    type GenericResponse,
} from '../../../lib/utils/apiResponse';
import type { RequestHandler } from './$types';

const GET_RES: GenericResponse<{
    version: string
}> = apiResponse({
    version: __VERSION__,
});

export const GET = (() => GET_RES) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
export const PUT = apiRes404;