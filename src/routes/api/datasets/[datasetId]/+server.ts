import { Settings } from '$lib/controllers/settings/settings.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import type { RequestHandler } from './$types';
import { Dataset } from '$lib/controllers/dataset/dataset';
import { query } from '$lib/db/mysql.server';
import { error } from '@sveltejs/kit';
import { getAuthFromCookies } from '$lib/security/getAuthFromCookies';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { z } from 'zod';

export const GET = cachedApiRoute(async (auth, { params }) => {
    const datasetId = params.datasetId;
    const { val: settings, err: getSettingsErr } = await Settings.allAsMapWithDefaults(query, auth);
    if (getSettingsErr) throw error(500, getSettingsErr);
    const { val, err } = await Dataset.fetchWholeDataset(query, auth, settings, datasetId);
    if (err) throw error(400, err);
    return {
        rows: val
    };
}) satisfies RequestHandler;

export const POST = (async ({ cookies, request, params }) => {
    const auth = await getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(request, {
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

    const { err } = await Dataset.appendRows(query, auth, params.datasetId, res.data);
    if (err) throw error(400, err);

    return apiResponse({});
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
