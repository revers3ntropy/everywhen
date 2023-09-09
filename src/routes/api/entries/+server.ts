import { decrypt } from '$lib/utils/encryption';
import { wordCount } from '$lib/utils/text';
import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { Label } from '$lib/controllers/label/label.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { GETParamIsTruthy } from '$lib/utils/GETArgs';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { nowUtc } from '$lib/utils/time';
import { z } from 'zod';
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

    const searchDecrypted = decrypt(search, auth.key).unwrap(() =>
        error(400, 'Invalid search query')
    );

    const [entries, numEntries] = (
        await Entry.getPage(auth, offset, count, {
            deleted,
            labelId,
            search: searchDecrypted.toLowerCase(),
            locationId
        })
    ).unwrap(e => error(400, e));

    return {
        entries,
        offset,
        count,
        totalPages: Math.ceil(numEntries / count),
        totalEntries: numEntries
    };
}) satisfies RequestHandler;

export const POST = (async ({ request, cookies }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth, request, {
        body: z.string(),
        title: z.string().default(''),
        created: z.number().default(nowUtc()),
        latitude: z.number().optional().nullable(),
        longitude: z.number().optional().nullable(),
        labelId: z.string().optional().nullable(),
        timezoneUtcOffset: z.number().default(0),
        agentData: z.string().default(''),
        wordCount: z.number().optional()
    });

    const labels = (await Label.all(auth)).unwrap(e => error(400, e));

    const entry = (
        await Entry.create(
            auth,
            labels,
            body.title,
            body.body,
            body.created,
            body.timezoneUtcOffset,
            null,
            null,
            body.latitude || null,
            body.longitude || null,
            body.labelId || null,
            body.agentData,
            body.wordCount ?? wordCount(body.body),
            []
        )
    ).unwrap(e => error(400, e));

    return apiResponse(auth, { id: entry.id });
}) satisfies RequestHandler;

export const DELETE = apiRes404;
export const PUT = apiRes404;
