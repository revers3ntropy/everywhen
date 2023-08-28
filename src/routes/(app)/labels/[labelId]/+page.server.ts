import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { Event } from '$lib/controllers/event/event.server';
import { Label } from '$lib/controllers/label/label.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import type { PageServerLoad } from './$types';

export const load = cachedPageRoute(async (auth, { params }) => {
    const labelId = params.labelId;
    if (!labelId) throw error(404, 'Not found');

    const { val: label, err } = await Label.Server.fromId(auth, labelId);
    if (err) throw error(404, err);

    const { val: entries, err: entriesErr } = await Entry.Server.getPage(auth, 0, 1, {
        labelId
    });
    if (entriesErr) throw error(400, entriesErr);

    const { err: eventsErr, val: events } = await Event.Server.all(auth);
    if (eventsErr) throw error(400, eventsErr);

    const { err: LabelsErr, val: labels } = await Label.Server.all(auth);
    if (LabelsErr) throw error(400, LabelsErr);

    return {
        label,
        entryCount: entries[1],
        events: events.filter(event => event.label?.id === labelId),
        labels
    };
}) satisfies PageServerLoad;
