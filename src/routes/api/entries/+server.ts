import { error } from '@sveltejs/kit';
import { Entry } from '../../../lib/controllers/entry';
import { Label } from '../../../lib/controllers/label';
import { query } from '../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';
import { apiRes404, apiResponse } from '../../../lib/utils/apiResponse';
import { cachedApiRoute, invalidateCache } from '../../../lib/utils/cache';
import { GETParamIsTruthy } from '../../../lib/utils/GETArgs';
import { getUnwrappedReqBody } from '../../../lib/utils/requestBody';
import { nowS } from '../../../lib/utils/time';
import type { RequestHandler } from './$types';

export const GET = cachedApiRoute((async (auth, { url }) => {
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    const page = parseInt(url.searchParams.get('page') || '0');
    const deleted = GETParamIsTruthy(url.searchParams.get('deleted'));
    const search = (url.searchParams.get('search') || '').toLowerCase();
    const labelId = url.searchParams.get('labelId') || undefined;
    if (page < 0) throw error(400, 'Invalid page number');
    if (!pageSize || pageSize < 0) throw error(400, 'Invalid page size');

    const { val, err } = await Entry.getPage(
        query, auth,
        page, pageSize,
        { deleted, labelId, search },
    );
    if (err) throw error(400, err);
    const [ entries, numEntries ] = val;

    return {
        entries,
        page,
        pageSize,
        totalPages: Math.ceil(numEntries / pageSize),
        totalEntries: numEntries,
    };
})) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    let body = await getUnwrappedReqBody(request, {
        created: 'number',
        latitude: 'number',
        longitude: 'number',
        title: 'string',
        entry: 'string',
        label: 'string',
        timezoneUtcOffset: 'number',
    }, {
        title: '',
        label: '',
        latitude: 0,
        longitude: 0,
        created: nowS(),
        timezoneUtcOffset: 0,
    });

    // check label exists
    if (body.label) {
        if (!await Label.userHasLabelWithId(query, auth, body.label)) {
            throw error(400, `Label doesn't exist`);
        }
    }

    const { val: entry, err } = await Entry.create(
        query, auth, {
            ...body,
            latitude: body.latitude || undefined,
            longitude: body.longitude || undefined,
            createdTZOffset: body.timezoneUtcOffset,
        },
    );
    if (err) throw error(400, err);

    return apiResponse({ id: entry.id });
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
