import { error } from '@sveltejs/kit';
import { Entry } from '../../../lib/controllers/entry';
import { Event } from '../../../lib/controllers/event';
import { Label } from '../../../lib/controllers/label';
import { query } from '../../../lib/db/mysql';
import { cachedPageRoute } from '../../../lib/utils/cache';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth, { params }) => {
    const labelId = params.labelId;
    if (!labelId) throw error(404, 'Not found');

    const { val: label, err } = await Label.fromId(query, auth, labelId);
    if (err) throw error(404, err);

    const { val: entries, err: entriesErr } = await Entry.getPage(
        query,
        auth,
        0,
        1,
        { labelId }
    );
    if (entriesErr) throw error(400, entriesErr);

    const { err: eventsErr, val: events } = await Event.all(query, auth);
    if (eventsErr) throw error(400, eventsErr);

    const { err: LabelsErr, val: labels } = await Label.all(query, auth);
    if (LabelsErr) throw error(400, LabelsErr);

    return {
        label,
        entryCount: entries[1],
        events: events.filter(event => event.label?.id === labelId),
        labels
    };
}) satisfies PageServerLoad;
