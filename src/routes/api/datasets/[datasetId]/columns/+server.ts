import { builtInTypes } from '$lib/controllers/dataset/columnTypes';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { invalidateCache } from '$lib/utils/cache.server';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Dataset } from '$lib/controllers/dataset/dataset.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { z } from 'zod';
import { Auth } from '$lib/controllers/auth/auth.server';

export const POST = (async ({ cookies, request, params }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const { name, type: typeId } = await getUnwrappedReqBody(auth, request, {
        name: z.string(),
        type: z.string().default('string')
    });

    if (!(typeId in builtInTypes)) {
        return error(400, 'Invalid column type');
    }
    const type = builtInTypes[typeId as keyof typeof builtInTypes];

    const col = (await Dataset.addColumn(auth, params.datasetId, name, type)).unwrap(e =>
        error(400, e)
    );

    return apiResponse(auth, col);
}) satisfies RequestHandler;

export const GET = apiRes404;
export const PUT = apiRes404;
export const DELETE = apiRes404;
