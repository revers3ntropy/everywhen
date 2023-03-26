import { error } from '@sveltejs/kit';
import { Entry } from '../../../../lib/controllers/entry';
import { query } from '../../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../../lib/security/getAuthFromCookies';
import { apiRes404, apiResponse } from '../../../../lib/utils/apiResponse';
import { getUnwrappedReqBody } from '../../../../lib/utils/requestBody';
import type { RequestHandler } from './$types';

export const DELETE = (async ({ request, params, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    if (!params.entryId) throw error(400, 'invalid id');

    const body = await getUnwrappedReqBody(request, {
        restore: 'boolean',
    });

    let { err: deleteErr } = await Entry.delete(
        query, auth,
        params.entryId, body.restore,
    );
    if (deleteErr) throw error(400, deleteErr);

    return apiResponse({ id: params.entryId });
}) satisfies RequestHandler;

export const PUT = (async ({ request, params, cookies }) => {
    const auth = await getAuthFromCookies(cookies);
    if (!params.entryId) throw error(400, 'invalid id');

    const body = await getUnwrappedReqBody(request, {
        title: 'string',
        entry: 'string',
        label: 'string',
        latitude: 'number',
        longitude: 'number',
    }, {
        title: '',
        entry: '',
        label: '',
        latitude: null as unknown as number,
        longitude: null as unknown as number,
    });

    const {
        err: entryErr,
        val: entry,
    } = await Entry.fromId(query, auth, params.entryId, true);
    if (entryErr) throw error(400, entryErr);

    const { err } = await Entry.edit(
        query, auth,
        entry,
        body.title,
        body.entry,
        body.latitude,
        body.longitude,
        body.label,
    );

    if (err) throw error(400, err);

    return apiResponse({ id: entry.id });
}) satisfies RequestHandler;

export const GET = apiRes404;
export const POST = apiRes404;
