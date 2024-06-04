import { builtInTypes } from '$lib/controllers/dataset/columnTypes';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { invalidateCache } from '$lib/utils/cache.server';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Dataset } from '$lib/controllers/dataset/dataset.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { z } from 'zod';
import { Auth } from '$lib/controllers/auth/auth.server';

export const PUT = (async ({ cookies, request, params }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const { name, type: typeId } = await getUnwrappedReqBody(auth, request, {
        name: z.string().optional(),
        type: z.string().optional()
    });

    if (typeId !== undefined) {
        if (!(typeId in builtInTypes)) {
            return error(400, 'Invalid column type');
        }
        const type = builtInTypes[typeId as keyof typeof builtInTypes];

        (await Dataset.updateColumnType(auth, params.datasetId, params.columnId, type)).unwrap(e =>
            error(400, e)
        );
    }

    if (name !== undefined) {
        (await Dataset.updateColumnName(auth, params.datasetId, params.columnId, name)).unwrap(e =>
            error(400, e)
        );
    }

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const GET = apiRes404;
export const POST = apiRes404;
export const DELETE = apiRes404;
