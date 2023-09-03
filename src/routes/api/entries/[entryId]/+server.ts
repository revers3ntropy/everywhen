import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async (auth, { params }) => {
    if (!params.entryId) throw error(400, 'invalid id');

    const { err, val: entry } = await Entry.Server.getFromId(auth, params.entryId, true);

    if (err) throw error(400, err);

    return { ...entry };
}) satisfies RequestHandler;

export const DELETE = (async ({ request, params, cookies }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    if (!params.entryId) throw error(400, 'invalid id');
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth, request, {
        restore: 'boolean'
    });

    const { err: deleteErr } = await Entry.Server.del(auth, params.entryId, body.restore);
    if (deleteErr) throw error(400, deleteErr);

    return apiResponse(auth, { id: params.entryId });
}) satisfies RequestHandler;

export const PUT = (async ({ request, params, cookies }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    if (!params.entryId) throw error(400, 'invalid id');
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(
        auth,
        request,
        {
            title: 'string',
            entry: 'string',
            label: 'string',
            latitude: 'number',
            longitude: 'number',
            timezoneUtcOffset: 'number',
            agentData: 'string'
        },
        {
            title: '',
            entry: '',
            label: '',
            latitude: 0,
            longitude: 0,
            timezoneUtcOffset: 0,
            agentData: ''
        }
    );

    const { err: entryErr, val: entry } = await Entry.Server.getFromId(auth, params.entryId, true);
    if (entryErr) throw error(400, entryErr);

    const { err } = await Entry.Server.edit(
        auth,
        entry,
        body.title,
        body.entry,
        body.latitude || null,
        body.longitude || null,
        body.label,
        body.timezoneUtcOffset,
        body.agentData
    );

    if (err) throw error(400, err);

    return apiResponse(auth, { id: entry.id });
}) satisfies RequestHandler;

export const POST = apiRes404;
