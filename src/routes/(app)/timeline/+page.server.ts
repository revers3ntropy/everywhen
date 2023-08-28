import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry.server';
import { Event } from '$lib/controllers/event/event.server';
import { Label } from '$lib/controllers/label/label.server';
import { cachedPageRoute } from '$lib/utils/cache.server';

export type TimelineEntry = Omit<Entry, 'entry'>;

export const load = cachedPageRoute(async auth => {
    const { val: entries, err } = await Entry.Server.all(auth);
    if (err) throw error(400, err);

    const { val: events, err: eventsErr } = await Event.Server.all(auth);
    if (eventsErr) throw error(400, eventsErr);

    const { val: labels, err: labelsErr } = await Label.Server.all(auth);
    if (labelsErr) throw error(400, labelsErr);

    return {
        entries: entries.map(e => ({
            ...e,
            entry: undefined
        })) as TimelineEntry[],
        events,
        labels
    };
});
