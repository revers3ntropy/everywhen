import { error } from '@sveltejs/kit';
import { cachedPageRoute } from '../../hooks.server';
import { Entry } from '../../lib/controllers/entry';
import { Event } from '../../lib/controllers/event';
import { query } from '../../lib/db/mysql';
import { wordCount } from '../../lib/utils/text';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth) => {
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