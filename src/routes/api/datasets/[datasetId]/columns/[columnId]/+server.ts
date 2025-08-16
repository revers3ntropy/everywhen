import { error } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { builtInTypes } from '$lib/controllers/dataset/columnTypes';
import { api404Handler, apiResponse } from '$lib/utils/apiResponse.server';
import { invalidateCache } from '$lib/utils/cache.server';
import { Dataset } from '$lib/controllers/dataset/dataset.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { Auth } from '$lib/controllers/auth/auth.server';

export const PUT = (async ({ cookies, request, params }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const {
        name,
        type: typeId,
        updatedRows
    } = await getUnwrappedReqBody(auth, request, {
        name: z.string().optional(),
        type: z.string().optional(),
        updatedRows: z
            .array(
                z.object({
                    id: z.number(),
                    rowJson: z.string()
                })
            )
            .optional()
    });

    if (typeId !== undefined) {
        if (!(typeId in builtInTypes)) {
            error(400, 'Invalid column type');
        }
        const type = builtInTypes[typeId as keyof typeof builtInTypes];

        if (!updatedRows) error(400, 'must give updated rows if changing column type');
        (
            await Dataset.updateColumnType(
                auth,
                params.datasetId,
                params.columnId,
                type,
                updatedRows
            )
        ).unwrap(e => error(400, e));
    }

    if (name !== undefined) {
        (await Dataset.updateColumnName(auth, params.datasetId, params.columnId, name)).unwrap(e =>
            error(400, e)
        );
    }

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const GET = api404Handler;
export const POST = api404Handler;
export const DELETE = api404Handler;
