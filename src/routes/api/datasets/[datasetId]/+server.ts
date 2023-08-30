import { Settings } from '$lib/controllers/settings/settings.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import type { RequestHandler } from './$types';
import { Dataset } from '$lib/controllers/dataset/dataset.server';
import { error } from '@sveltejs/kit';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { z } from 'zod';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async (auth, { params }) => {
    const { datasetId } = params;
    const settings = (await Settings.Server.allAsMapWithDefaults(auth)).unwrap(e => error(500, e));
    return (await Dataset.Server.fetchWholeDataset(auth, settings, datasetId)).unwrap(e =>
        error(400, e)
    );
}) satisfies RequestHandler;

export const POST = (async ({ cookies, request, params }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth, request, {
        rows: 'object'
    });

    const rowsValidator = z.array(
        z.object({
            created: z.number().optional(),
            timestamp: z.number().optional(),
            timestampTzOffset: z.number().optional(),
            elements: z.array(z.any())
        })
    );

    const res = rowsValidator.safeParse(body.rows);
    if (!res.success) throw error(400, res.error);

    (await Dataset.Server.appendRows(auth, params.datasetId, res.data)).unwrap(e => error(400, e));

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
