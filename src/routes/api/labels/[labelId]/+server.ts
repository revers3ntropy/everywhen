import { error } from '@sveltejs/kit';
import { Entry } from '../../../../lib/controllers/entry';
import { Label } from '../../../../lib/controllers/label';
import { query } from '../../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../../lib/security/getAuthFromCookies';
import { getUnwrappedReqBody } from '../../../../lib/utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, params }) => {
    const auth = await getAuthFromCookies(cookies);

    const { val: label, err } = await Label.fromId(query, auth, params.labelId);
    if (err) throw error(404, err);

    return new Response(
        JSON.stringify(label),
        { status: 200 },
    );
};

export const PUT: RequestHandler = async ({ cookies, request, params }) => {
    const auth = await getAuthFromCookies(cookies);
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
        const { err, val } = await label.updateName(query, auth, body.name);
        if (err) throw error(400, err);
        label = val;
    }

    if (body.colour) {
        const { err } = await label.updateColour(query, body.colour);
        if (err) throw error(400, err);
    }

    return new Response(
        JSON.stringify({}),
        { status: 200 },
    );
};

export let DELETE: RequestHandler = async ({ cookies, params }) => {
    const auth = await getAuthFromCookies(cookies);

    if (!await Label.userHasLabelWithId(query, auth, params.labelId)) {
        throw error(404, 'Label with that id not found');
    }

    const { val: [ _, entriesWithLabel ], err } = await Entry.getPage(
        query, auth,
        0, 1,
        {
            labelId: params.labelId,
            deleted: 'both',
        },
    );

    if (err) throw error(500, err);
    if (entriesWithLabel !== 0) {
        throw error(400, 'Label is in use');
    }

    // TODO: don't actually delete, just mark as deleted
    await Label.purgeWithId(query, auth, params.labelId);

    return new Response(
        JSON.stringify({}),
        { status: 200 },
    );
};