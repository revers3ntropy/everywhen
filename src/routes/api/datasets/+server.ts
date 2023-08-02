import { Settings } from '$lib/controllers/settings/settings.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import type { RequestHandler } from './$types';
import { Dataset } from '$lib/controllers/dataset/dataset';
import { query } from '$lib/db/mysql.server';
import { error } from '@sveltejs/kit';
import { getAuthFromCookies } from '$lib/security/getAuthFromCookies';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { nowUtc } from '$lib/utils/time';

export const GET = cachedApiRoute(async auth => {
    const { val: settings, err: getSettingsErr } = await Settings.allAsMapWithDefaults(query, auth);
    if (getSettingsErr) throw error(500, getSettingsErr);
    const { val, err } = await Dataset.allMetaData(query, auth, settings);
    if (err) throw error(400, err);
    return {
        datasets: val
    };
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(
        request,
        {
            created: 'number',
            name: 'string',
            columns: 'object'
        },
        {
            created: nowUtc(),
            columns: []
        }
    );

    const rawColumns = body.columns;
    if (!Array.isArray(rawColumns)) throw error(400, `Columns must be an array`);
    const columns = rawColumns.map((c, i) => {
        if (typeof c !== 'object' || c === null) {
            throw error(400, `Column ${i} must be an object`);
        }
        if (!('name' in c) || typeof c.name !== 'string') {
            throw error(400, `Column ${i} must have a name`);
        }
        if (!('type' in c) || typeof c.type !== 'string') {
            throw error(400, `Column ${i} must have a type`);
        }
        return {
            name: c.name,
            type: c.type
        };
    });

    const { val: dataset, err } = await Dataset.create(
        query,
        auth,
        body.name,
        body.created,
        columns
    );
    if (err) throw error(400, err);

    return apiResponse({ id: dataset.id });
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
