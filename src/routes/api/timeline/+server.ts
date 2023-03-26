import { error } from '@sveltejs/kit';
import { Entry } from '../../../lib/controllers/entry';
import { Event } from '../../../lib/controllers/event';
import { query } from '../../../lib/db/mysql';
import { getAuthFromCookies } from '../../../lib/security/getAuthFromCookies';
import { apiRes404, apiResponse } from '../../../lib/utils/apiResponse';
import { wordCount } from '../../../lib/utils/text';
import type { RequestHandler } from './$types';

export const GET = (async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    let { val: entries, err } = await Entry.all(query, auth);
    if (err) throw error(400, err);

    let { val: events, err: eventsErr } = await Event.all(query, auth);
    if (eventsErr) throw error(400, eventsErr);

    return apiResponse({
        entries: entries.map(e => ({
            ...e,
            wordCount: wordCount(e.entry),
        })),
        events,
    });
}) satisfies RequestHandler;

export const POST = apiRes404;
export const DELETE = apiRes404;
export const PUT = apiRes404;
