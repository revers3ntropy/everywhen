import { decrypt } from '$lib/utils/encryption';
import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry';
import { Label } from '$lib/controllers/label/label';
import { query } from '$lib/db/mysql.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { GETParamIsTruthy } from '$lib/utils/GETArgs';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { nowUtc } from '$lib/utils/time';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async (auth, { url }) => {
    const count = parseInt(url.searchParams.get('count') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const deleted = GETParamIsTruthy(url.searchParams.get('deleted'));
    const search = url.searchParams.get('search') || '';
    const labelId = url.searchParams.get('labelId') || undefined;
    const locationId = url.searchParams.get('locationId') || undefined;
    if (offset < 0) throw error(400, 'Invalid page number');
    if (!count || count < 0) throw error(400, 'Invalid page size');

    const { err: searchErr, val: searchDecrypted } = decrypt(search, auth.key);
    if (searchErr) throw error(400, 'Invalid search query');

    const { val, err } = await Entry.getPage(query, auth, offset, count, {
        deleted,
        labelId,
        search: searchDecrypted.toLowerCase(),
        locationId
    });
    if (err) throw error(400, err);
    const [entries, numEntries] = val;

    return {
        entries,
        offset,
        count,
        totalPages: Math.ceil(numEntries / count),
        totalEntries: numEntries
    };
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(
        auth,
        request,
        {
            created: 'number',
            latitude: 'number',
            longitude: 'number',
            title: 'string',
            entry: 'string',
            label: 'string',
            timezoneUtcOffset: 'number',
            agentData: 'string'
        },
        {
            title: '',
            label: '',
            latitude: 0,
            longitude: 0,
            created: nowUtc(),
            timezoneUtcOffset: 0,
            agentData: ''
        }
    );

    if (body.label) {
        if (!(await Label.userHasLabelWithId(query, auth, body.label))) {
            throw error(400, `Label doesn't exist`);
        }
    }

    const { val: entry, err } = await Entry.create(query, auth, {
        ...body,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        // timezoneUtcOffset is automatically added to every req
        createdTZOffset: body.timezoneUtcOffset
    });
    if (err) throw error(400, err);

    return apiResponse(auth, { id: entry.id });
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
