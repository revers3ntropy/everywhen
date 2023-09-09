import { Settings } from '$lib/controllers/settings/settings.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { nowUtc } from '$lib/utils/time';
import type { RequestHandler } from './$types';
import { Dataset } from '$lib/controllers/dataset/dataset.server';
import { error } from '@sveltejs/kit';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { z } from 'zod';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async (auth, { params }) => {
    const { datasetId } = params;
    const settings = (await Settings.allAsMapWithDefaults(auth)).unwrap(e => error(500, e));
    return (await Dataset.getDatasetRows(auth, settings, datasetId, {})).unwrap(e => error(400, e));
}) satisfies RequestHandler;

export const POST = (async ({ cookies, request, params }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const { rows } = await getUnwrappedReqBody(auth, request, {
        rows: z.array(
            z.object({
                created: z.number().default(nowUtc()),
                timestamp: z.number().optional(),
                timestampTzOffset: z.number().optional(),
                elements: z.array(z.unknown())
            })
        )
    });

    (await Dataset.appendRows(auth, params.datasetId, rows)).unwrap(e => error(400, e));

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
