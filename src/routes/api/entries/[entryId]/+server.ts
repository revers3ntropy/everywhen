import { error } from '@sveltejs/kit';
import { Entry } from '../../../../lib/controllers/entry';
import { Label } from '../../../../lib/controllers/label';
import { query } from '../../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../../lib/security/getAuthFromCookies';
import { getUnwrappedReqBody } from '../../../../lib/utils';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ request, params, cookies }) => {
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

    return new Response(JSON.stringify({
        id: params.entryId,
    }), { status: 200 });
};

export const PUT: RequestHandler = async ({ request, params, cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    if (!params.entryId) {
        throw error(400, 'invalid id');
    }

    const body = await getUnwrappedReqBody(request, {
        label: 'string',
    }, {
        label: '',
    });

    const { err: entryErr, val: entry } = await Entry.fromId(
        query, auth,
        params.entryId,
    );
    if (entryErr) throw error(400, entryErr);

    if (entry.label?.id === body.label || (!body.label && !entry.label)) {
        throw error(400, 'Entry already has that label');
    }

    if (body.label) {
        if (!await Label.userHasLabelWithId(query, auth, body.label)) {
            throw error(404, 'Label not found');
        }
    }

    const updateRes = await entry.updateLabel(query, auth, body.label);
    if (updateRes.err) {
        throw error(400, updateRes.err);
    }

    return new Response(JSON.stringify({}), { status: 200 });
};
