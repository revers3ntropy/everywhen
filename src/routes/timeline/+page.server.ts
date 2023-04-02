import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { Entry } from '../../lib/controllers/entry';
import { Event } from '../../lib/controllers/event';
import { query } from '../../lib/db/mysql';
import { getAuthFromCookies } from '../../lib/security/getAuthFromCookies';
import { wordCount } from '../../lib/utils/text';

export const load = (async ({ cookies }) => {
    const auth = await getAuthFromCookies(cookies);

    let { val: entries, err } = await Entry.all(query, auth);
    if (err) throw error(400, err);

    let { val: events, err: eventsErr } = await Event.all(query, auth);
    if (eventsErr) throw error(400, eventsErr);

    return {
        entries: JSON.parse(JSON.stringify(
            entries.map(e => ({
                ...e,
                wordCount: wordCount(e.entry),
            })),
        )),
        events: JSON.parse(JSON.stringify(
            events,
        )),
    };
}) satisfies PageServerLoad;