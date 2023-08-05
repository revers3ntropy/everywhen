import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry';
import { Event } from '$lib/controllers/event/event';
import { Label } from '$lib/controllers/label/label';
import { query } from '$lib/db/mysql.server';
import { apiRes404, apiResponse } from '$lib/utils/apiResponse.server';
import { cachedApiRoute, invalidateCache } from '$lib/utils/cache.server';
import { getUnwrappedReqBody } from '$lib/utils/requestBody.server';
import type { RequestHandler } from './$types';
import { Auth } from '$lib/controllers/auth/auth.server';

export const GET = cachedApiRoute(async (auth, { params }) => {
    const { val: label, err } = await Label.fromId(query, auth, params.labelId);
    if (err) throw error(404, err);
    return label;
}) satisfies RequestHandler;

export const PUT = (async ({ cookies, request, params }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(
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

    const { val, err } = await Label.fromId(query, auth, params.labelId);
    if (err) throw error(400, err);
    let label = val;

    if (body.name) {
        const { err, val } = await Label.updateName(query, auth, label, body.name);
        if (err) throw error(400, err);
        label = val;
    }

    if (body.color) {
        const { err } = await Label.updateColor(query, label, body.color);
        if (err) throw error(400, err);
    }

    return apiResponse(auth, {});
}) satisfies RequestHandler;

export const DELETE = (async ({ cookies, params, request }) => {
    const auth = Auth.Server.getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    if (!(await Label.userHasLabelWithId(query, auth, params.labelId))) {
        throw error(404, 'Label with that id not found');
    }

    const { val, err } = await Entry.getPage(query, auth, 0, 1, {
        labelId: params.labelId,
        deleted: 'both'
    });
    if (err) throw error(400, err);

    const { err: eventsErr, val: eventsWithLabel } = await Event.withLabel(
        query,
        auth,
        params.labelId
    );
    if (eventsErr) throw error(400, eventsErr);

    const [, entriesWithLabel] = val;
    if (entriesWithLabel < 1 && eventsWithLabel.length < 1) {
        await Label.purgeWithId(query, auth, params.labelId);
        return apiResponse(auth, {});
    }

    const { strategy, newLabelId } = await getUnwrappedReqBody(
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
        if (!(await Label.userHasLabelWithId(query, auth, newLabelId))) {
            throw error(400, 'New label not found');
        }

        await Entry.reassignAllLabels(query, auth, params.labelId, newLabelId);
        await Event.reassignAllLabels(query, auth, params.labelId, newLabelId);
        await Label.purgeWithId(query, auth, params.labelId);
        return apiResponse(auth, {});
    }

    if (strategy === 'remove') {
        await Entry.removeAllLabel(query, auth, params.labelId);
        await Event.removeAllLabel(query, auth, params.labelId);
        await Label.purgeWithId(query, auth, params.labelId);
        return apiResponse(auth, {});
    }

    throw error(400, 'Invalid deletion strategy');
}) satisfies RequestHandler;

export const POST = apiRes404;
