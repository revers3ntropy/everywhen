import { error } from '@sveltejs/kit';
import { Event } from '../../../lib/controllers/event';
import { Label } from '../../../lib/controllers/label';
import { query } from '../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';
import { getUnwrappedReqBody, nowS } from '../../../lib/utils';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const { err, val: events } = await Event.all(query, auth);
    if (err) throw error(400, err);

    return new Response(
        JSON.stringify({ events }),
        { status: 200 },
    );
};

export const POST: RequestHandler = async ({ request, cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    const body = await getUnwrappedReqBody(request, {
        created: 'number',
        name: 'string',
        start: 'number',
        end: 'number',
        label: 'string',
    }, {
        created: nowS(),
        label: '',
    });

    // check label exists
    if (body.label) {
        if (!await Label.userHasLabelWithId(query, auth, body.label)) {
            throw error(400, `Label doesn't exist`);
        }
    }

    const { val: event, err } = await Event.create(
        query, auth,
        body.name,
        body.start,
        body.end,
        body.label,
        body.created,
    );
    if (err) throw error(400, err);

    return new Response(
        JSON.stringify({ id: event.id }),
        { status: 201 },
    );

};