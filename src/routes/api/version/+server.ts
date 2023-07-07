import { apiRes404, type GenericResponse } from '$lib/utils/apiResponse.server';
import type { RequestHandler } from './$types';

// Use 'v' over 'version' to save bytes,
// as this is a very common request
const GET_RES = JSON.stringify({
    v: __VERSION__
});

export const GET = (() =>
    new Response(GET_RES, {
        status: 200
    }) as GenericResponse<{ v: string }>) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
export const PUT = apiRes404;
