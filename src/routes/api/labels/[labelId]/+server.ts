import { error } from '@sveltejs/kit';
import { Entry } from '../../../../lib/controllers/entry';
import { Event } from '../../../../lib/controllers/event';
import { Label } from '../../../../lib/controllers/label';
import { query } from '../../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../../lib/security/getAuthFromCookies';
import { apiRes404, apiResponse } from '../../../../lib/utils/apiResponse';
import { cachedApiRoute, invalidateCache } from '../../../../lib/utils/cache';
import { getUnwrappedReqBody } from '../../../../lib/utils/requestBody';
import type { RequestHandler } from './$types';

export const GET = cachedApiRoute(async (auth, { params }) => {
    const { val: label, err } = await Label.fromId(query, auth, params.labelId);
    if (err) throw error(404, err);
    return label;
}) satisfies RequestHandler;

export const PUT = (async ({ cookies, request, params }) => {
    const auth = await getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    const body = await getUnwrappedReqBody(request, {
        name: 'string',
        colour: 'string',
    }, {
        name: '',
        colour: '',
    });

    let { val: label, err } = await Label.fromId(query, auth, params.labelId);
    if (err) throw error(400, err);

    if (body.name) {
        const { err, val } = await Label.updateName(query, auth, label, body.name);
        if (err) throw error(400, err);
        label = val;
    }

    if (body.colour) {
        const { err } = await Label.updateColour(query, label, body.colour);
        if (err) throw error(400, err);
    }

    return apiResponse({});
}) satisfies RequestHandler;

export let DELETE = (async ({ cookies, params, request }) => {
    const auth = await getAuthFromCookies(cookies);
    invalidateCache(auth.id);

    if (!await Label.userHasLabelWithId(query, auth, params.labelId)) {
        throw error(404, 'Label with that id not found');
    }

    const { val, err } = await Entry.getPage(
        query, auth,
        0, 1,
        {
            labelId: params.labelId,
            deleted: 'both',
        },
    );
    if (err) throw error(400, err);

    const {
        err: eventsErr,
        val: eventsWithLabel,
    } = await Event.withLabel(query, auth, params.labelId);
    if (eventsErr) throw error(400, eventsErr);

    const [ _, entriesWithLabel ] = val;
    if (entriesWithLabel < 1 && eventsWithLabel.length < 1) {
        await Label.purgeWithId(query, auth, params.labelId);
        return apiResponse({});
    }

    const { strategy, newLabelId } = await getUnwrappedReqBody(request, {
        strategy: 'string',
        newLabelId: 'string',
    }, {
        strategy: 'remove',
        newLabelId: '',
    });

    if (strategy === 'reassign') {
        if (!await Label.userHasLabelWithId(query, auth, newLabelId)) {
            throw error(400, 'New label not found');
        }

        await Entry.reassignAllLabels(query, auth, params.labelId, newLabelId);
        await Event.reassignAllLabels(query, auth, params.labelId, newLabelId);
        await Label.purgeWithId(query, auth, params.labelId);
        return apiResponse({});
    }

    if (strategy === 'remove') {
        await Entry.removeAllLabel(query, auth, params.labelId);
        await Event.removeAllLabel(query, auth, params.labelId);
        await Label.purgeWithId(query, auth, params.labelId);
        return apiResponse({});
    }

    throw error(400, 'Invalid strategy');
}) satisfies RequestHandler;

export const POST = apiRes404;
