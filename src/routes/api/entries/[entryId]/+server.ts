import { Label } from '../../../../lib/controllers/label';
import { getAuthFromCookies } from '../../../../lib/security/getAuthFromCookies';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Entry } from '../../../../lib/controllers/entry';
import { extractBody } from '../../../../lib/utils';

export const DELETE: RequestHandler = async ({ request, params, cookies }) => {
    const { id: userId } = await getAuthFromCookies(cookies);

    const { entryId } = params;
    if (!entryId) {
        throw error(400, 'invalid id');
    }

    const bodyRes = await extractBody(request, {
        restore: void 0
    });
    let { val: body, err: bodyErr } = bodyRes.resolve();
    if (bodyErr) {
        throw error(400, bodyErr);
    }

    if (typeof body.restore !== 'boolean') {
        throw error(400, 'invalid \'restore\' in body');
    }

    let deleteRes = await Entry.delete(userId, entryId, body.restore);
    if (deleteRes.isErr) {
        throw error(400, deleteRes.unwrapErr());
    }

    return new Response(JSON.stringify({
        id: entryId
    }), { status: 200 });
};

export const PUT: RequestHandler = async ({ request, params, cookies }) => {
    const { id: userId } = await getAuthFromCookies(cookies);

    if (!params.entryId) {
        throw error(400, 'invalid id');
    }

    const bodyRes = await extractBody(request, {
        label: void 0
    });
    let { val: body, err: bodyErr } = bodyRes.resolve();
    if (bodyErr) {
        throw error(400, bodyErr);
    }

    if (body.label !== null && typeof body.label !== 'string') {
        throw error(400, 'invalid label');
    }

    const entryResult = await Entry.fromId(userId, params.entryId);
    const { val: entry, err: entryErr } = entryResult.resolve();
    if (entryErr) {
        throw error(400, entryErr);
    }

    if (entry.label?.id === body.label || (!body.label && !entry.label)) {
        throw error(400, 'Entry already has that label');
    }

    if (body.label !== null) {
        if (!await Label.userHasLabel(userId, body.label)) {
            throw error(404, 'Label not found');
        }
    }

    const updateRes = await entry.updateLabel(userId, body.label);
    if (updateRes.isErr) {
        throw error(400, updateRes.unwrapErr());
    }

    return new Response(JSON.stringify({}), { status: 200 });
};
