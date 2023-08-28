import { decrypt } from '$lib/utils/encryption';
import { wordCount } from '$lib/utils/text';
import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
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

    const { val, err } = await Entry.Server.getPage(auth, offset, count, {
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
            agentData: 'string',
            wordCount: 'number'
        },
        {
            title: '',
            label: '',
            latitude: 0,
            longitude: 0,
            created: nowUtc(),
            timezoneUtcOffset: 0,
            agentData: '',
            wordCount: -1
        }
    );

    const { val: labels, err: labelsErr } = await Label.all(query, auth);
    if (labelsErr) throw error(400, labelsErr);

    const { val: entry, err } = await Entry.Server.create(
        auth,
        labels,
        body.title,
        body.entry,
        body.created,
        body.timezoneUtcOffset,
        null,
        null,
        body.latitude || null,
        body.longitude || null,
        body.label,
        body.agentData,
        body.wordCount > -1 ? body.wordCount : wordCount(body.entry),
        []
    );
    if (err) throw error(400, err);

    return apiResponse(auth, { id: entry.id });
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
