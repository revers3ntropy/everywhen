import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { Event } from '$lib/controllers/event/event.server';
import { Label } from '$lib/controllers/label/label.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async (auth, { params }) => {
    return (await Label.Server.fromId(auth, params.labelId)).unwrap(e => error(404, e));
}) satisfies RequestHandler;

export const PUT = (async ({ cookies, request, params }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(
        auth,
        request,
        {
            name: 'string',
            color: 'string'
        },
        {
            name: '',
            color: ''
        }
    );

    let label = (await Label.Server.fromId(auth, params.labelId)).unwrap(e => error(400, e));

    if (body.name) {
        label = (await Label.Server.updateName(auth, label, body.name)).unwrap(e => error(400, e));
    }

    if (body.color) {
        (await Label.Server.updateColor(label, body.color)).unwrap(e => error(400, e));
    }

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const DELETE = (async ({ cookies, params, request }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    if (!(await Label.Server.userHasLabelWithId(auth, params.labelId))) {
        throw error(404, 'Label with that id not found');
    }

    const { val, err } = await Entry.Server.getPage(auth, 0, 1, {
        labelId: params.labelId,
        deleted: 'both'
    });
    if (err) throw error(400, err);

    const { err: eventsErr, val: eventsWithLabel } = await Event.Server.withLabel(
        auth,
        params.labelId
    );
    if (eventsErr) throw error(400, eventsErr);

    const [, entriesWithLabel] = val;
    if (entriesWithLabel < 1 && eventsWithLabel.length < 1) {
        await Label.Server.purgeWithId(auth, params.labelId);
        return apiResponse(auth, {});
    }

    const { strategy, newLabelId } = await getUnwrappedReqBody(
        auth,
        request,
        {
            strategy: 'string',
            newLabelId: 'string'
        },
        {
            strategy: 'remove',
            newLabelId: ''
        }
    );

    if (strategy === 'reassign') {
        if (!(await Label.Server.userHasLabelWithId(auth, newLabelId))) {
            throw error(400, 'New label not found');
        }

        await Entry.Server.reassignAllLabels(auth, params.labelId, newLabelId);
        await Event.Server.reassignAllLabels(auth, params.labelId, newLabelId);
        await Label.Server.purgeWithId(auth, params.labelId);
        return apiResponse(auth, {});
    }

    if (strategy === 'remove') {
        await Entry.Server.removeAllLabel(auth, params.labelId);
        await Event.Server.removeAllLabel(auth, params.labelId);
        await Label.Server.purgeWithId(auth, params.labelId);
        return apiResponse(auth, {});
    }

    throw error(400, 'Invalid deletion strategy');
}) satisfies RequestHandler;

export const POST = apiRes404;
