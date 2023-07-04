import { error } from '@sveltejs/kit';
import { Entry } from '$lib/controllers/entry/entry';
import { Event } from '$lib/controllers/event/event';
import { Label } from '$lib/controllers/label/label';
import { query } from '$lib/db/mysql.server';
import { cachedPageRoute } from '$lib/utils/cache.server';
import { wordCount } from '$lib/utils/text';

export type TimelineEntry = Omit<Entry, 'entry'> & {
    wordCount: number;
};

export const load = cachedPageRoute(async auth => {
    const { val: entries, err } = await Entry.all(query, auth);
    if (err) throw error(400, err);

    const { val: events, err: eventsErr } = await Event.all(query, auth);
    if (eventsErr) throw error(400, eventsErr);

    const { val: labels, err: labelsErr } = await Label.all(query, auth);
    if (labelsErr) throw error(400, labelsErr);

    return {
        entries: entries.map(e => ({
            ...e,
            wordCount: wordCount(e.entry),
            entry: undefined
        })) as TimelineEntry[],
        events,
        labels
    };
});
