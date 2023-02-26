import { error } from '@sveltejs/kit';
import { Entry } from '../../../../lib/controllers/entry';
import { getUnwrappedReqBody } from '../../../../lib/utils';
import type { RequestHandler } from './$types';
import { getAuthFromCookies } from '../../../../lib/security/getAuthFromCookies';
import { Label } from '../../../../lib/controllers/label';

export const GET: RequestHandler = async ({ cookies, params }) => {
    const auth = await getAuthFromCookies(cookies);

    const { val: label, err } = await Label.fromId(auth, params.labelId);
    if (err) throw error(404, err);

    return new Response(
        JSON.stringify(label),
        { status: 200 }
    );
};

export const PUT: RequestHandler = async ({ cookies, request, params }) => {
    const auth = await getAuthFromCookies(cookies);
    const body = await getUnwrappedReqBody(request, {
        name: 'string',
        colour: 'string'
    }, {
        name: '',
        colour: ''
    });

    let { val: label, err } = await Label.fromId(auth, params.labelId);
    if (err) throw error(400, err);

    if (body.name) {
        const { err, val } = await label.updateName(auth, body.name);
        if (err) throw error(400, err);
        label = val;
    }

    if (body.colour) {
        const { err } = await label.updateColour(body.colour);
        if (err) throw error(400, err);
    }

    return new Response(
        JSON.stringify({}),
        { status: 200 }
    );
};

export let DELETE: RequestHandler = async ({ cookies, params }) => {
    const auth = await getAuthFromCookies(cookies);

    if (!await Label.userHasLabelWithId(auth, params.labelId)) {
        throw error(404, 'Label with that id not found');
    }

    const { val: [ _, entriesWithLabel ], err } = await Entry.getPage(
        auth, 0, 1, {
            labelId: params.labelId,
            deleted: 'both'
        });

    if (err) throw error(500, err);
    if (entriesWithLabel !== 0) {
        throw error(400, 'Label is in use');
    }

    // TODO: don't actually delete, just mark as deleted
    await Label.purgeWithId(auth, params.labelId);

    return new Response(
        JSON.stringify({}),
        { status: 200 }
    );
};