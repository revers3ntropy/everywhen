import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { Event } from '$lib/controllers/event/event.server';
import { Label } from '$lib/controllers/label/label.server';
import { api404Handler, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async (auth, { params }) => {
    return (await Label.fromId(auth, params.labelId)).unwrap(e => error(404, e));
}) satisfies RequestHandler;

export const PUT = (async ({ cookies, request, params }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(auth, request, {
        name: z.string().optional(),
        color: z.string().optional()
    });

    let label = (await Label.fromId(auth, params.labelId)).unwrap(e => error(400, e));

    if (body.name) {
        label = (await Label.updateName(auth, label, body.name)).unwrap(e => error(400, e));
    }

    if (body.color) {
        await Label.updateColor(label, body.color);
    }

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const DELETE = (async ({ cookies, params, request }) => {
    const auth = Auth.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    if (!(await Label.userHasLabelWithId(auth, params.labelId))) {
        error(404, 'Label with that id not found');
    }

    const { entryCount, editCount, eventCount } = (
        await Label.fromIdWithUsageCounts(auth, params.labelId)
    ).unwrap(e => error(400, e));

    if (entryCount + editCount + eventCount < 1) {
        await Label.purgeWithId(auth, params.labelId);
        return apiResponse(auth, {});
    }

    const { strategy, newLabelId } = await getUnwrappedReqBody(auth, request, {
        strategy: z.string(),
        newLabelId: z.string().optional()
    });

    if (strategy === 'reassign') {
        if (!newLabelId) error(400, 'New label id must be provided');
        if (!(await Label.userHasLabelWithId(auth, newLabelId))) error(400, 'New label not found');

        await Entry.reassignAllLabels(auth, params.labelId, newLabelId);
        await Event.reassignAllLabels(auth, params.labelId, newLabelId);
        await Label.purgeWithId(auth, params.labelId);
        return apiResponse(auth, {});
    }

    if (strategy === 'remove') {
        await Entry.removeAllLabel(auth, params.labelId);
        await Event.removeAllLabel(auth, params.labelId);
        await Label.purgeWithId(auth, params.labelId);
        return apiResponse(auth, {});
    }

    error(400, 'Invalid deletion strategy');
}) satisfies RequestHandler;

export const POST = api404Handler;
